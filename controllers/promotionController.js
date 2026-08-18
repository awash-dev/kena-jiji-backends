const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongoDbId");
const promotionRepository = require("../repositories/promotionRepository");
const { createActivity } = require("../services/activityService");

const createPromotion = asyncHandler(async (req, res) => {
  const existing = (await promotionRepository.findAll()).find((item) => item.code === req.body.code);
  if (existing) return res.status(400).json({ message: "Discount code already exists" });

  const newPromotion = await promotionRepository.create({
    code: req.body.code,
    discount_type: req.body.discountType,
    amount: req.body.amount,
    expiration_date: req.body.expirationDate,
    min_order_amount: req.body.minOrderAmount,
    max_discount_amount: req.body.maxDiscountAmount,
    product_ids: req.body.productIds,
    created_by: req.body.createdBy,
  });

  await createActivity({
    action: "create Promotion",
    resource: "Promotion",
    resourceId: newPromotion._id,
    user: newPromotion.createdBy,
    details: { newPromotion },
  });

  res.status(201).json(newPromotion);
});

const updatePromotion = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  const updatedPromotion = await promotionRepository.updateById(req.params.id, {
    code: req.body.code,
    discount_type: req.body.discountType,
    amount: req.body.amount,
    expiration_date: req.body.expirationDate,
    min_order_amount: req.body.minOrderAmount,
    max_discount_amount: req.body.maxDiscountAmount,
    product_ids: req.body.productIds,
    created_by: req.body.createdBy,
    active: req.body.active,
  });
  if (!updatedPromotion) return res.status(404).json({ message: "Promotion not found" });
  await createActivity({
    action: "Update Promotion",
    resource: "Promotion",
    resourceId: updatedPromotion._id,
    user: updatedPromotion.createdBy,
    details: { updatedPromotion },
  });
  res.json(updatedPromotion);
});

const getPromotionById = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  const promotion = await promotionRepository.findById(req.params.id);
  if (!promotion) return res.status(404).json({ message: "Promotion not found" });
  res.json(promotion);
});

const getAllPromotions = asyncHandler(async (req, res) => res.json(await promotionRepository.findAll()));

const deactivatePromotion = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  const deactivatedPromotion = await promotionRepository.updateById(req.params.id, { active: false });
  if (!deactivatedPromotion) return res.status(404).json({ message: "Promotion not found" });
  await createActivity({
    action: "deactivate Promotion",
    resource: "Promotion",
    resourceId: deactivatedPromotion._id,
    user: deactivatedPromotion.createdBy,
    details: { deactivatedPromotion },
  });
  res.json(deactivatedPromotion);
});

const getPromotionsByProductId = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.productId);
  res.json(await promotionRepository.findByProductId(req.params.productId));
});

module.exports = { createPromotion, updatePromotion, getPromotionById, getAllPromotions, deactivatePromotion, getPromotionsByProductId };
