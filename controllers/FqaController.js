const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");
const { fqaRepository } = require("../repositories/catalogRepositories");

const createEnquiry = asyncHandler(async (req, res) => {
  res.json(
    await fqaRepository.create({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      comment: req.body.comment,
      status: req.body.status,
      postedbyuserid: req.body.PostedByuserId,
    })
  );
});

const updateEnquiry = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  res.json(
    await fqaRepository.updateById(req.params.id, {
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      comment: req.body.comment,
      status: req.body.status,
      postedbyuserid: req.body.PostedByuserId,
    })
  );
});

const deleteEnquiry = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  res.json(await fqaRepository.deleteById(req.params.id));
});

const getEnquiry = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  res.json(await fqaRepository.findById(req.params.id));
});

const getallEnquiry = asyncHandler(async (req, res) => res.json(await fqaRepository.findAll()));

module.exports = { createEnquiry, updateEnquiry, deleteEnquiry, getEnquiry, getallEnquiry };
