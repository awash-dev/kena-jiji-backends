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
const { isAdmin, authMiddleware } = require("../middlewares/authMiddleware");

router.post("/", isAdmin, createPromotion);
router.put("/:id", isAdmin, updatePromotion);
router.get("/:id", getPromotionById);
router.get("/", getAllPromotions);
router.patch("/deactivate/:id",  isAdmin, deactivatePromotion);
router.get("/product/:productId", getPromotionsByProductId);
module.exports = router;
