const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");
const { productSubcategoryRepository } = require("../repositories/catalogRepositories");
const { createActivity } = require("../services/activityService");

const createSubcategory = asyncHandler(async (req, res) => {
  const newCategory = await productSubcategoryRepository.create({
    title: req.body.title,
    postedbyuserid: req.body.PostedByuserId || req.user?._id,
  });
  await createActivity({
    action: "create SubCategory",
    resource: "SubCategory",
    resourceId: newCategory._id,
    user: newCategory.PostedByuserId,
    details: { newCategory },
  });
  res.json(newCategory);
});

const updateSubcategory = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  const updatedCategory = await productSubcategoryRepository.updateById(req.params.id, {
    title: req.body.title,
    postedbyuserid: req.body.PostedByuserId || req.user?._id,
  });
  if (!updatedCategory) {
    res.status(404);
    throw new Error("SubCategory not found");
  }
  await createActivity({
    action: "Update SubCategory",
    resource: "SubCategory",
    resourceId: updatedCategory._id,
    user: updatedCategory.PostedByuserId,
    details: { updatedCategory },
  });
  res.json(updatedCategory);
});

const deleteSubcategory = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  const deletedCategory = await productSubcategoryRepository.deleteById(req.params.id);
  if (!deletedCategory) {
    res.status(404);
    throw new Error("SubCategory not found");
  }
  await createActivity({
    action: "Delete SubCategory",
    resource: "SubCategory",
    resourceId: deletedCategory._id,
    user: deletedCategory.PostedByuserId,
    details: { deletedCategory },
  });
  res.json(deletedCategory);
});

const getSubcategory = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  res.json(await productSubcategoryRepository.findById(req.params.id));
});

const getallSubcategory = asyncHandler(async (req, res) => res.json(await productSubcategoryRepository.findAll()));

module.exports = { createSubcategory, updateSubcategory, deleteSubcategory, getSubcategory, getallSubcategory };
