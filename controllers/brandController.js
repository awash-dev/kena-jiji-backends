const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");
const { brandRepository } = require("../repositories/catalogRepositories");
const { createActivity } = require("../services/activityService");

const createBrand = asyncHandler(async (req, res) => {
  const newBrand = await brandRepository.create({
    title: req.body.title,
    postedbyuserid: req.body.PostedByuserId,
  });
  await createActivity({
    action: "create Brand",
    resource: "Brand",
    resourceId: newBrand._id,
    user: newBrand.PostedByuserId,
    details: { brandData: req.body },
  });
  res.json(newBrand);
});

const updateBrand = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  const updateBrand = await brandRepository.updateById(req.params.id, {
    title: req.body.title,
    postedbyuserid: req.body.PostedByuserId,
  });
  await createActivity({
    action: "Update Brand",
    resource: "Brand",
    resourceId: updateBrand._id,
    user: updateBrand.PostedByuserId,
    details: { updateBrand },
  });
  res.json(updateBrand);
});

const deleteBrand = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  const deleteBrand = await brandRepository.deleteById(req.params.id);
  await createActivity({
    action: "Delete Brand",
    resource: "Brand",
    resourceId: deleteBrand?._id,
    user: deleteBrand?.PostedByuserId,
    details: { deleteBrand },
  });
  res.json(deleteBrand);
});

const getBrand = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  res.json(await brandRepository.findById(req.params.id));
});

const getallBrand = asyncHandler(async (req, res) => res.json(await brandRepository.findAll()));

module.exports = { createBrand, updateBrand, deleteBrand, getBrand, getallBrand };
