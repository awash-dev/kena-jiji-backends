const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId.js");
const { tagRepository } = require("../repositories/catalogRepositories");
const { createActivity } = require("../services/activityService");

const createTag = asyncHandler(async (req, res) => {
  const newTag = await tagRepository.create({
    title: req.body.title,
    postedbyuserid: req.body.PostedByuserId,
  });
  await createActivity({
    action: "Create Tag",
    resource: "Tag",
    resourceId: newTag._id,
    user: newTag.PostedByuserId,
    details: { newTag },
  });
  res.json(newTag);
});

const updateTag = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  const updatedTag = await tagRepository.updateById(req.params.id, {
    title: req.body.title,
    postedbyuserid: req.body.PostedByuserId,
  });
  await createActivity({
    action: "Update Tag",
    resource: "Tag",
    resourceId: updatedTag._id,
    user: updatedTag.PostedByuserId,
    details: { updatedTag },
  });
  res.json(updatedTag);
});

const deleteTag = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  const deletedTag = await tagRepository.deleteById(req.params.id);
  await createActivity({
    action: "Delete Tag",
    resource: "Tag",
    resourceId: deletedTag?._id,
    user: deletedTag?.PostedByuserId,
    details: { deletedTag },
  });
  res.json(deletedTag);
});

const getTag = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  res.json(await tagRepository.findById(req.params.id));
});

const getallTag = asyncHandler(async (req, res) => res.json(await tagRepository.findAll()));

module.exports = { createTag, updateTag, deleteTag, getTag, getallTag };
