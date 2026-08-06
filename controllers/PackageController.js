const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId.js");
const { packageRepository } = require("../repositories/catalogRepositories");

const createPackage = asyncHandler(async (req, res) => {
  res.json(
    await packageRepository.create({
      name: req.body.name,
      duration: req.body.duration,
      amount: req.body.amount,
      created_by_user_id: req.body.createdByUserId,
    })
  );
});

const updatePackage = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  res.json(
    await packageRepository.updateById(req.params.id, {
      name: req.body.name,
      duration: req.body.duration,
      amount: req.body.amount,
      created_by_user_id: req.body.createdByUserId,
    })
  );
});

const deletePackage = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  res.json(await packageRepository.deleteById(req.params.id));
});

const getPackage = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  res.json(await packageRepository.findById(req.params.id));
});

const getAllPackages = asyncHandler(async (req, res) => res.json(await packageRepository.findAll()));

module.exports = { createPackage, updatePackage, deletePackage, getPackage, getAllPackages };
