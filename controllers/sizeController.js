const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId.js");
const { sizeRepository } = require("../repositories/catalogRepositories");
const { createActivity } = require("../services/activityService");

const createSize = asyncHandler(async (req, res) => {
  const newSize = await sizeRepository.create({
    title: req.body.title,
    postedbyuserid: req.body.PostedByuserId || req.user?._id,
  });
  await createActivity({
    action: "create Size",
    resource: "Size",
    resourceId: newSize._id,
    user: newSize.PostedByuserId,
    details: { newSize },
  });
  res.json(newSize);
});

const updateSize = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  const updatedSize = await sizeRepository.updateById(req.params.id, {
    title: req.body.title,
    postedbyuserid: req.body.PostedByuserId || req.user?._id,
  });
  await createActivity({
    action: "Update Size",
    resource: "Size",
    resourceId: updatedSize._id,
    user: updatedSize.PostedByuserId,
    details: { updatedSize },
  });
  res.json(updatedSize);
});

const deleteSize = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  const deletedSize = await sizeRepository.deleteById(req.params.id);
  await createActivity({
    action: "Delete Size",
    resource: "Size",
    resourceId: deletedSize?._id,
    user: deletedSize?.PostedByuserId,
    details: { deletedSize },
  });
  res.json(deletedSize);
});

const getSize = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  res.json(await sizeRepository.findById(req.params.id));
});

const getallSize = asyncHandler(async (req, res) => res.json(await sizeRepository.findAll()));

module.exports = { createSize, updateSize, deleteSize, getSize, getallSize };
