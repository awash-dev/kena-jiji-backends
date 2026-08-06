const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId.js");
const { blogSubcategoryRepository } = require("../repositories/catalogRepositories");

const createSubcategory = asyncHandler(async (req, res) => {
  res.json(
    await blogSubcategoryRepository.create({
      title: req.body.title,
      postedbyuserid: req.body.PostedByuserId,
    })
  );
});

const updateSubcategory = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  res.json(
    await blogSubcategoryRepository.updateById(req.params.id, {
      title: req.body.title,
      postedbyuserid: req.body.PostedByuserId,
    })
  );
});

const deleteSubcategory = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  res.json(await blogSubcategoryRepository.deleteById(req.params.id));
});

const getSubcategory = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  res.json(await blogSubcategoryRepository.findById(req.params.id));
});

const getallSubcategory = asyncHandler(async (req, res) => res.json(await blogSubcategoryRepository.findAll()));

module.exports = { createSubcategory, updateSubcategory, deleteSubcategory, getSubcategory, getallSubcategory };
