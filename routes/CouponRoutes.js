const express = require("express");
const {
    createCoupon,
    getAllCoupons,
    updateCoupon,
    deleteCoupon,
    getCoupon,
} = require("../controllers/CouponController")
const { authMiddleware, isSuperAdminOrAdmin } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/", authMiddleware, isSuperAdminOrAdmin, createCoupon);
router.get("/", authMiddleware, isSuperAdminOrAdmin, getAllCoupons);
router.get("/:id", authMiddleware, isSuperAdminOrAdmin, getCoupon);
router.put("/:id", authMiddleware, isSuperAdminOrAdmin, updateCoupon);
router.delete("/:id", authMiddleware, isSuperAdminOrAdmin, deleteCoupon);

module.exports = router;