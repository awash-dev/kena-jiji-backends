const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const validateMongoDbId = require("../utils/validateMongoDbId.js");
const storeRepository = require("../repositories/storeRepository");
const productRepository = require("../repositories/productRepository");
const { createActivity } = require("../services/activityService");

const createStore = asyncHandler(async (req, res) => {
  const { storeName, address, owner_id } = req.body;
  if (!storeName || !address || !owner_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const newStore = await storeRepository.create({
    store_id: req.body.storeId || uuidv4(),
    store_name: storeName,
    owner_id,
    address,
  });

  await createActivity({
    action: "Create store",
    resource: "Store",
    resourceId: newStore._id,
    user: newStore.ownerId,
    details: { newStore },
  });

  res.status(201).json({ message: "Store created successfully", store: newStore });
});

const getStoresByUser = async (req, res) => {
  try {
    const stores = await storeRepository.findByOwnerId(req.params.id);
    res.status(200).json(stores || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Merchants may only update/delete stores they own; admins may manage any.
const assertStoreOwnership = async (req, storeId) => {
  if (req.user?.role !== "merchant") return;
  const store = await storeRepository.findById(storeId);
  if (!store) {
    const err = new Error("Store not found");
    err.status = 404;
    throw err;
  }
  const ownerId = store.owner_id?._id || store.owner_id;
  if (ownerId && ownerId.toString() !== req.user._id.toString()) {
    const err = new Error("You can only manage your own stores.");
    err.status = 403;
    throw err;
  }
};

const updateStore = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  await assertStoreOwnership(req, req.params.id);
  const updatedStore = await storeRepository.updateById(req.params.id, {
    store_name: req.body.storeName,
    address: req.body.address,
    owner_id: req.body.owner_id,
    store_id: req.body.storeId,
  });
  await createActivity({
    action: "Update store",
    resource: "Store",
    resourceId: updatedStore._id,
    user: updatedStore.ownerId,
    details: { updatedStore: req.body },
  });
  res.json(updatedStore);
});

const deleteStore = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  await assertStoreOwnership(req, req.params.id);
  const deletedStore = await storeRepository.deleteById(req.params.id);
  if (!deletedStore) return res.status(404).json({ message: "Store not found" });

  const products = await productRepository.findByStore(req.params.id);
  await Promise.all(products.map((product) => productRepository.deleteById(product._id)));

  await createActivity({
    action: "Delete store",
    resource: "Store",
    resourceId: deletedStore._id,
    user: deletedStore.ownerId,
    details: { deletedStore },
  });

  res.status(200).json({ message: "Store and associated products deleted successfully", deletedStore });
});

const getStore = asyncHandler(async (req, res) => {
  const stores = await storeRepository.findByOwnerId(req.params.id);
  res.json(stores || []);
});

const getallStore = asyncHandler(async (req, res) => res.json(await storeRepository.findAll()));

module.exports = { createStore, updateStore, deleteStore, getStore, getallStore, getStoresByUser };
