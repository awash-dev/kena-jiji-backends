const express = require("express");
const {
  createUser,
  getDeliveryBoys,
  getAssignedOrders,
  updateDeliveryBoy,
  deleteDeliveryBoy,
  updateOrderStatus,
  getDeliveryBoyById,
  activateUser,
  deactivateDeliveryPerson
} = require("../controler/userController");
const { authMiddleware, isAdmin,isDeliveryBoy } = require("../../../middlewares/authMiddleware");
const router = express.Router();

// Admin routes
router.post("/users", authMiddleware, isAdmin, createUser); // Create user (admin can create delivery boys)
router.get("/delivery-boys", authMiddleware, isAdmin, getDeliveryBoys); // Get all delivery boys
router.get("/delivery-boys/:id", authMiddleware, isAdmin, getDeliveryBoyById); // Get a specific delivery boy by ID

router.put("/delivery-boys/:id", authMiddleware, isAdmin, updateDeliveryBoy); // Update delivery boy
router.delete("/delivery-boys/:id", authMiddleware, isAdmin, deleteDeliveryBoy); // Delete delivery boy
router.get("/assigned/:deliveryPersonId", authMiddleware, isDeliveryBoy, getAssignedOrders);
router.put("/order/:orderId/status", authMiddleware, isDeliveryBoy, updateOrderStatus);
router.put("/:id/activate", authMiddleware, isAdmin, activateUser);
router.put("/delivery-boys/:id/deactivate", authMiddleware, isAdmin, deactivateDeliveryPerson);

module.exports = router;
