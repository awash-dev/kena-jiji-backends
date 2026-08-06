const wishlistRepository = require("../repositories/wishlistRepository");

const getWishlist = async (req, res) => {
  try {
    res.json(await wishlistRepository.findProductsByUser(req.user.id));
  } catch (error) {
    res.status(500).json({ message: "An error occurred while fetching the wishlist." });
  }
};

const addToWishlist = async (req, res) => {
  try {
    const wishlist = await wishlistRepository.add(req.user.id, req.body.productId);
    res.json(wishlist || { userId: req.user.id, productId: req.body.productId });
  } catch (error) {
    res.status(500).json({ message: "An error occurred while adding the product to the wishlist." });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const wishlistItem = await wishlistRepository.remove(req.user.id, req.params.productId);
    if (!wishlistItem) return res.status(404).json({ message: "Product not found in your wishlist" });
    res.json({ message: "Product removed from wishlist successfully" });
  } catch (error) {
    res.status(500).json({ message: "An error occurred while removing the product from the wishlist." });
  }
};

const getWishlistTotal = async (req, res) => {
  try {
    res.json({ total: await wishlistRepository.countByUser(req.user.id) });
  } catch (error) {
    res.status(500).json({ message: "An error occurred while fetching the total number of wishlist items." });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getWishlistTotal,
};
