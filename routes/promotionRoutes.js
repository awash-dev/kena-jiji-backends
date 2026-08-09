const express = require("express");
const router = express.Router();
const {
    createPromotion,
    updatePromotion,
    getPromotionById,
    getAllPromotions,
    deactivatePromotion,
    getPromotionsByProductId,
} = require("../controllers/promotionController");
const { isSuperAdminOrAdmin, authMiddleware } = require("../middlewares/authMiddleware");

router.post("/", authMiddleware, isSuperAdminOrAdmin, createPromotion);
router.put("/:id", authMiddleware, isSuperAdminOrAdmin, updatePromotion);
router.get("/:id", getPromotionById);
router.get("/", getAllPromotions);
router.patch("/deactivate/:id",  authMiddleware, isSuperAdminOrAdmin, deactivatePromotion);
router.get("/product/:productId", getPromotionsByProductId);
module.exports = router;
