const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");
const { colorRepository } = require("../repositories/catalogRepositories");
const { createActivity } = require("../services/activityService");

const createColor = asyncHandler(async (req, res) => {
  const newColor = await colorRepository.create({
    title: req.body.title,
    postedbyuserid: req.body.PostedByuserId,
  });
  await createActivity({
    action: "create Color",
    resource: "Color",
    resourceId: newColor._id,
    user: newColor.PostedByuserId,
    details: { newColor: req.body },
  });
  res.json(newColor);
});

const updateColor = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  const updatedColor = await colorRepository.updateById(req.params.id, {
    title: req.body.title,
    postedbyuserid: req.body.PostedByuserId,
  });
  await createActivity({
    action: "Update Color",
    resource: "Color",
    resourceId: updatedColor._id,
    user: updatedColor.PostedByuserId,
    details: { updatedColor: req.body },
  });
  res.json(updatedColor);
});

const deleteColor = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  const deletedColor = await colorRepository.deleteById(req.params.id);
  await createActivity({
    action: "Delete Color",
    resource: "Color",
    resourceId: deletedColor?._id,
    user: deletedColor?.PostedByuserId,
    details: { deletedColor: req.body },
  });
  res.json(deletedColor);
});

const getColor = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  res.json(await colorRepository.findById(req.params.id));
});

const getColorsByIds = asyncHandler(async (req, res) => res.json(await colorRepository.findByIds(req.body.ids || [])));
const getallColor = asyncHandler(async (req, res) => res.json(await colorRepository.findAll()));

module.exports = { createColor, updateColor, deleteColor, getColor, getallColor, getColorsByIds };
