const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");
const { couponRepository } = require("../repositories/catalogRepositories");

const createCoupon = asyncHandler(async (req, res) => {
  res.json(
    await couponRepository.create({
      name: req.body.name,
      expiry: req.body.expiry,
      discount: req.body.discount,
      postedbyuserid: req.user?._id ?? req.body.postedbyuserid ?? req.body.PostedByuserId,
    })
  );
});

const getAllCoupons = asyncHandler(async (req, res) => res.json(await couponRepository.findAll()));

const updateCoupon = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  res.json(
    await couponRepository.updateById(req.params.id, {
      name: req.body.name,
      expiry: req.body.expiry,
      discount: req.body.discount,
      postedbyuserid: req.user?._id ?? req.body.postedbyuserid ?? req.body.PostedByuserId,
    })
  );
});

const deleteCoupon = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  res.json(await couponRepository.deleteById(req.params.id));
});

const getCoupon = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  res.json(await couponRepository.findById(req.params.id));
});

module.exports = { createCoupon, getAllCoupons, updateCoupon, deleteCoupon, getCoupon };
