const express = require("express");
const {
    initializePayment,
    verifyPayment,
} = require("../controllers/paymentControroller");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/initialize", authMiddleware, initializePayment);
router.get("/verify", authMiddleware, verifyPayment);

module.exports = router;