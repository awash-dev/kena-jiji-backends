const express = require("express");
const { authMiddleware, isDeliveryBoy } = require("../middlewares/authMiddleware");

const { getAssignedOrders, markOrderDelivered } = require("../controllers/deliveryController");

const router = express.Router();

// Route to get all assigned orders for the delivery boy
router.get("/assigned-orders", getAssignedOrders);

// Route to mark an order as delivered
router.put("/order/:id/delivered", authMiddleware, isDeliveryBoy, markOrderDelivered);

module.exports = router;
