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
router.post("/users", createUser); // Create user (admin can create delivery boys)
router.get("/delivery-boys",  getDeliveryBoys); // Get all delivery boys
router.get("/delivery-boys/:id", getDeliveryBoyById); // Get a specific delivery boy by ID

router.put("/delivery-boys/:id", authMiddleware, isAdmin, updateDeliveryBoy); // Update delivery boy
router.delete("/delivery-boys/:id", authMiddleware, isAdmin, deleteDeliveryBoy); // Delete delivery boy
router.get("/assigned/:deliveryPersonId", getAssignedOrders);
router.put("/order/:orderId/status", updateOrderStatus);
router.put("/:id/activate", activateUser);
router.put("/delivery-boys/:id/deactivate", deactivateDeliveryPerson);

module.exports = router;
