const express = require("express");
const { getCart, addToCart, increaseCartQuantity, decreaseCartQuantity, removeFromCart, getCartTotal,clearCart } = require("../controllers/cartController");
const { authMiddleware } = require("../middlewares/authMiddleware"); // Import auth middleware

const router = express.Router();

router.get("/", authMiddleware, getCart);
router.post("/add", authMiddleware, addToCart);
router.post("/increase", authMiddleware, increaseCartQuantity);
router.post("/decrease", authMiddleware, decreaseCartQuantity);
router.delete('/remove', authMiddleware, removeFromCart); 
router.delete('/clear', authMiddleware, clearCart);
router.get('/total', authMiddleware, getCartTotal);

module.exports = router;
