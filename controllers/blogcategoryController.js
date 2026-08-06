const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");
const { blogCategoryRepository } = require("../repositories/catalogRepositories");
const { createActivity } = require("../services/activityService");

const createCategory = asyncHandler(async (req, res) => {
  const newCategory = await blogCategoryRepository.create({
    title: req.body.title,
    postedbyuserid: req.body.PostedByuserId,
  });
  await createActivity({
    action: "Create Blog Category",
    resource: "BlogCategory",
    resourceId: newCategory._id,
    user: newCategory.PostedByuserId,
    details: { newCategory },
  });
  res.json(newCategory);
});

const updateCategory = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  const updatedCategory = await blogCategoryRepository.updateById(req.params.id, {
    title: req.body.title,
    postedbyuserid: req.body.PostedByuserId,
  });
  res.json(updatedCategory);
});

const deleteCategory = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  res.json(await blogCategoryRepository.deleteById(req.params.id));
});

const getCategory = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  res.json(await blogCategoryRepository.findById(req.params.id));
});

const getallCategory = asyncHandler(async (req, res) => res.json(await blogCategoryRepository.findAll()));

module.exports = { createCategory, updateCategory, deleteCategory, getCategory, getallCategory };
