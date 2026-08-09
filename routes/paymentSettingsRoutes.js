const express = require("express");
const router = express.Router();
const { getPaymentSettings, updatePaymentSettings } = require("../controllers/paymentSettingsController");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

router.get("/", getPaymentSettings);
router.put("/", authMiddleware, isAdmin, updatePaymentSettings);

module.exports = router;
