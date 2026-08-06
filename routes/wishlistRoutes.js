const express = require('express');
const { getWishlist, addToWishlist, removeFromWishlist, getWishlistTotal } = require('../controllers/WishlistController');
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

// Route to get user's wishlist
router.get('/', authMiddleware, getWishlist);

// Route to add a product to the wishlist
router.post('/add', authMiddleware, addToWishlist);

// Route to remove a product from the wishlist
router.delete('/remove/:productId', authMiddleware, removeFromWishlist);

// Route to get total number of items in the wishlist
router.get('/total', authMiddleware, getWishlistTotal);

module.exports = router;
