const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const validateMongoDbId = require("../utils/validateMongoDbId");
const productRepository = require("../repositories/productRepository");
const userRepository = require("../repositories/userRepository");
const storeRepository = require("../repositories/storeRepository");
const { createActivity } = require("../services/activityService");

const parseMaybeJson = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
};

const normalizeApprovalStatus = (status) => {
  if (!status) {
    return status;
  }

  const normalized = String(status).trim().toLowerCase();
  if (["approved", "pending", "rejected"].includes(normalized)) {
    return normalized;
  }

  return status;
};

const normalizeColors = (payload) => {
  const parsedColorImagePairs = parseMaybeJson(payload.colorImagePairs);
  if (Array.isArray(parsedColorImagePairs)) {
    return parsedColorImagePairs.map((pair) => ({
      color: pair.color,
      images: Array.isArray(pair.images) ? pair.images : [],
    }));
  }

  const parsedColors = parseMaybeJson(payload.colors);
  if (Array.isArray(parsedColors)) {
    return parsedColors.map((pair) => ({
      color: pair.color,
      images: Array.isArray(pair.images) ? pair.images : [],
    }));
  }

  return undefined;
};

const normalizeProductPayload = (body) => {
  const payload = { ...body };
  const colors = normalizeColors(payload);
  const tags = parseMaybeJson(payload.tags);
  const ratings = parseMaybeJson(payload.ratings);
  const reviews = parseMaybeJson(payload.reviews);

  if (payload.title) {
    payload.slug = slugify(payload.title, { lower: true });
  }

  return {
    title: payload.title,
    slug: payload.slug,
    description: payload.description,
    price: payload.price,
    old_price: payload.oldPrice,
    category: payload.category,
    subcategory: payload.subcategory,
    brand: payload.brand,
    quantity: payload.quantity,
    sold: payload.sold,
    postedbyuserid: payload.PostedByuserId || payload.postedbyuserid || payload.postedByUserId,
    store: payload.store || payload.storeId,
    images: parseMaybeJson(payload.images) || parseMaybeJson(payload.Images),
    product_approved: normalizeApprovalStatus(
      payload.ProductApproved || payload.productApproved
    ),
    rejection_reason: parseMaybeJson(payload.rejectionReason),
    colors,
    tags: Array.isArray(tags) ? tags : undefined,
    ratings: Array.isArray(ratings) ? ratings : undefined,
    totalrating: payload.totalrating ?? payload.totalRating,
    reviews: Array.isArray(reviews) ? reviews : undefined,
  };
};

const ensureAdminStore = async (ownerId) => {
  const stores = await storeRepository.findByOwnerId(ownerId);
  if (stores.length > 0) return stores[0]._id;
  const user = await userRepository.findById(ownerId);
  const name = [user?.firstname, user?.lastname].filter(Boolean).join(" ").trim() || "Admin";
  const store = await storeRepository.create({
    store_name: `${name}'s Store`,
    owner_id: ownerId,
    address: "Admin",
  });
  return store._id;
};

const createProduct = asyncHandler(async (req, res) => {
  const payload = normalizeProductPayload(req.body);
  if (!payload.store && payload.postedbyuserid) {
    payload.store = await ensureAdminStore(payload.postedbyuserid);
  }
  const newProduct = await productRepository.create(payload);
  await createActivity({
    action: "create Product",
    resource: "Product",
    resourceId: newProduct._id,
    user: newProduct.PostedByuserId,
    details: { newProduct },
  });
  res.json(newProduct);
});

// Merchants may only update/delete products they own; admins may manage any.
const assertMerchantOwnership = async (req, productId) => {
  if (req.user?.role !== "merchant") return;
  const product = await productRepository.findById(productId);
  if (!product) {
    const err = new Error("Product not found");
    err.status = 404;
    throw err;
  }
  const ownerId = product.postedbyuserid?._id || product.postedbyuserid;
  if (ownerId && ownerId.toString() !== req.user._id.toString()) {
    const err = new Error("You can only manage your own products.");
    err.status = 403;
    throw err;
  }
};

const updateProduct = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  await assertMerchantOwnership(req, req.params.id);
  const updatedProduct = await productRepository.updateById(req.params.id, normalizeProductPayload(req.body));
  await createActivity({
    action: "Update Product",
    resource: "Product",
    resourceId: updatedProduct._id,
    user: updatedProduct.PostedByuserId,
    details: { updateProduct: updatedProduct },
  });
  res.json(updatedProduct);
});

const deleteProduct = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  await assertMerchantOwnership(req, req.params.id);
  const deletedProduct = await productRepository.deleteById(req.params.id);
  await createActivity({
    action: "Delete Product",
    resource: "Product",
    resourceId: req.params.id,
    user: req.body.userId,
    details: { deletedProduct },
  });
  res.json(deletedProduct);
});

const getaProduct = asyncHandler(async (req, res) => {
  const product = await productRepository.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
});

const buildProductFilters = (query = {}, fallbackApproval = null) => {
  const filters = {};
  ["category", "subcategory", "brand", "store"].forEach((key) => {
    if (query[key] !== undefined) filters[key] = query[key];
  });
  if (query.PostedByuserId) filters.postedbyuserid = query.PostedByuserId;
  if (fallbackApproval) filters.product_approved = fallbackApproval;
  if (query.ProductApproved) filters.product_approved = query.ProductApproved;
  return filters;
};

const getAllProduct = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 0);
  const products = await productRepository.findAll({
    filters: buildProductFilters(req.query, "approved"),
    limit: limit || undefined,
    offset: limit ? (page - 1) * limit : 0,
  });
  res.json(products);
});

const NotApprovedProducts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const products = await productRepository.findAll({
    filters: buildProductFilters(req.query, "pending"),
    limit,
    offset: (page - 1) * limit,
  });
  const totalCount = await productRepository.count({ product_approved: "pending" });
  res.status(200).json({
    products,
    pagination: { currentPage: page, totalPages: Math.ceil(totalCount / limit), totalCount },
  });
});

const RejectedProducts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const products = await productRepository.findAll({
    filters: buildProductFilters(req.query, "rejected"),
    limit,
    offset: (page - 1) * limit,
  });
  const totalCount = await productRepository.count({ product_approved: "rejected" });
  res.status(200).json({
    products,
    pagination: { currentPage: page, totalPages: Math.ceil(totalCount / limit), totalCount },
  });
});

const addToWishlist = asyncHandler(async (req, res) => {
  const user = await userRepository.findById(req.user._id);
  const wishlist = Array.isArray(user.wishlist) ? [...user.wishlist] : [];
  const alreadyAdded = wishlist.includes(req.body.productId);
  const updatedUser = await userRepository.updateById(req.user._id, {
    wishlist: alreadyAdded ? wishlist.filter((id) => id !== req.body.productId) : [...wishlist, req.body.productId],
  });
  res.json(updatedUser);
});

const rating = asyncHandler(async (req, res) => {
  const product = await productRepository.findById(req.body.prodId);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const ratings = Array.isArray(product.ratings) ? [...product.ratings] : [];
  const index = ratings.findIndex((item) => item.postedby === req.user._id);
  if (index >= 0) ratings[index] = { ...ratings[index], star: req.body.star, comment: req.body.comment };
  else ratings.push({ star: req.body.star, comment: req.body.comment, postedby: req.user._id });

  const total = ratings.length;
  const average = total ? Math.round(ratings.reduce((sum, item) => sum + Number(item.star || 0), 0) / total) : 0;
  res.json(await productRepository.updateById(req.body.prodId, { ratings, totalrating: average }));
});

const getStoreProducts = asyncHandler(async (req, res) => {
  const products = await productRepository.findByStore(req.params.id);
  if (!products.length) return res.status(202).json({ message: "No products found for this store" });
  res.status(200).json(products);
});

const updateProductStatus = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  if (!req.body.status) return res.status(400).json({ message: "Status is required" });
  const updatedProduct = await productRepository.updateById(req.params.id, {
    product_approved: normalizeApprovalStatus(req.body.status),
  });
  await createActivity({
    action: "Update Product status",
    resource: "Product",
    resourceId: updatedProduct._id,
    user: updatedProduct.PostedByuserId,
    details: { updatedProduct },
  });
  res.json(updatedProduct);
});

const buildCategoryCounts = (products) => {
  const counts = products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([category, count]) => ({ category, count }));
};

const getProductCountByCategory = async (req, res) => {
  try {
    const products = await productRepository.findByMerchant(req.params.id || req.params.merchantId);
    res.status(200).json({
      success: true,
      message: "Product count by unique category retrieved successfully",
      data: buildCategoryCounts(products),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

const fetchRecentProducts = async (req, res) => {
  try {
    const recentProducts = await productRepository.findByMerchant(req.params.id, { limit: 10 });
    if (!recentProducts.length) return res.status(202).json({ message: "No products found for this merchant." });
    res.status(200).json({ data: recentProducts });
  } catch (error) {
    res.status(500).json({ message: "Server error, please try again later." });
  }
};

const EachMerchantProducts = async (req, res) => {
  try {
    const recentProducts = await productRepository.findByMerchant(req.params.id);
    if (!recentProducts.length) return res.status(202).json({ message: "No products found for this merchant." });
    res.status(200).json({ data: recentProducts });
  } catch (error) {
    res.status(500).json({ message: "Server error, please try again later." });
  }
};

const AllGetProductCountByCategory = async (req, res) => {
  try {
    const products = await productRepository.findAll();
    res.status(200).json({
      success: true,
      message: "Product count by unique category retrieved successfully",
      data: buildCategoryCounts(products),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

const AllfetchRecentProducts = async (req, res) => {
  try {
    const recentProducts = await productRepository.findAll({ limit: 10 });
    if (!recentProducts.length) return res.status(202).json({ message: "No products found" });
    res.status(200).json({ data: recentProducts });
  } catch (error) {
    res.status(500).json({ message: "Server error, please try again later." });
  }
};

const AllEachMerchantProducts = async (req, res) => {
  try {
    const recentProducts = await productRepository.findAll();
    if (!recentProducts.length) return res.status(200).json({ message: "No products found for this merchant." });
    res.status(200).json({ data: recentProducts });
  } catch (error) {
    res.status(500).json({ message: "Server error, please try again later." });
  }
};

module.exports = {
  createProduct,
  getaProduct,
  getAllProduct,
  updateProduct,
  deleteProduct,
  addToWishlist,
  rating,
  updateProductStatus,
  getStoreProducts,
  getProductCountByCategory,
  fetchRecentProducts,
  EachMerchantProducts,
  AllGetProductCountByCategory,
  AllfetchRecentProducts,
  AllEachMerchantProducts,
  NotApprovedProducts,
  RejectedProducts,
};
