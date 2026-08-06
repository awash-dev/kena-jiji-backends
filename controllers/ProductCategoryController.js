const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");
const { productCategoryRepository } = require("../repositories/catalogRepositories");
const { createActivity } = require("../services/activityService");

const createCategory = asyncHandler(async (req, res) => {
  const newCategory = await productCategoryRepository.create({
    title: req.body.title,
    postedbyuserid: req.body.PostedByuserId,
  });
  await createActivity({
    action: "Create Category",
    resource: "Category",
    resourceId: newCategory._id,
    user: newCategory.PostedByuserId,
    details: { deletedCoupon: req.body },
  });
  res.json(newCategory);
});

const updateCategory = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  const updatedCategory = await productCategoryRepository.updateById(req.params.id, {
    title: req.body.title,
    postedbyuserid: req.body.PostedByuserId,
  });
  await createActivity({
    action: "Update Category",
    resource: "Category",
    resourceId: updatedCategory._id,
    user: updatedCategory.PostedByuserId,
    details: { updatedCategory: req.body },
  });
  res.json(updatedCategory);
});

const deleteCategory = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  const deletedCategory = await productCategoryRepository.deleteById(req.params.id);
  await createActivity({
    action: "Delete Category",
    resource: "Category",
    resourceId: deletedCategory?._id,
    user: deletedCategory?.PostedByuserId,
    details: { deletedCategory: req.body },
  });
  res.json(deletedCategory);
});

const getCategory = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  res.json(await productCategoryRepository.findById(req.params.id));
});

const getallCategory = asyncHandler(async (req, res) => res.json(await productCategoryRepository.findAll()));

module.exports = { createCategory, updateCategory, deleteCategory, getCategory, getallCategory };
