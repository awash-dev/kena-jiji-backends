const cartRepository = require("../repositories/cartRepository");

const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) return res.status(400).json({ message: "User ID is missing" });
    const cartItems = await cartRepository.findByUser(userId);
    res.status(200).json({ cart_items: cartItems });
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
};

const addToCart = async (req, res) => {
  try {
    const existingItem = await cartRepository.findOne({
      userId: req.user.id,
      productId: req.body.productId,
      selectedColor: req.body.selectedColor,
      selectedSize: req.body.selectedSize,
    });

    if (existingItem) {
      return res.status(200).json(
        await cartRepository.updateById(existingItem._id, {
          quantity: Number(existingItem.quantity || 0) + 1,
        })
      );
    }

    const newCartItem = await cartRepository.create({
      user_id: req.user.id,
      product_id: req.body.productId,
      quantity: 1,
      selected_color: req.body.selectedColor,
      selected_size: req.body.selectedSize,
    });

    res.status(201).json(newCartItem);
  } catch (error) {
    res.status(500).json({ message: "Error adding product to cart" });
  }
};

const increaseCartQuantity = async (req, res) => {
  try {
    const cartItem = await cartRepository.findOne({ userId: req.user.id, productId: req.body.productId });
    if (!cartItem) return res.status(404).json({ message: "Product not found in cart" });
    res.status(200).json(await cartRepository.updateById(cartItem._id, { quantity: Number(cartItem.quantity || 0) + 1 }));
  } catch (error) {
    res.status(500).json({ message: "Error increasing quantity" });
  }
};

const decreaseCartQuantity = async (req, res) => {
  try {
    const cartItem = await cartRepository.findOne({ userId: req.user.id, productId: req.body.productId });
    if (!cartItem) return res.status(404).json({ message: "Product not found in cart" });
    if (Number(cartItem.quantity) > 1) {
      return res.status(200).json(await cartRepository.updateById(cartItem._id, { quantity: Number(cartItem.quantity) - 1 }));
    }
    await cartRepository.deleteByUserAndProduct(req.user.id, req.body.productId);
    res.status(200).json({ message: "Product removed from cart" });
  } catch (error) {
    res.status(500).json({ message: "Error decreasing quantity" });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const cartItem = await cartRepository.deleteByUserAndProduct(req.user.id, req.body.productId);
    if (!cartItem) return res.status(404).json({ message: "Product not found in cart" });
    res.status(200).json({ message: "Product removed from cart" });
  } catch (error) {
    res.status(500).json({ message: "Error removing product from cart", error });
  }
};

const getCartTotal = async (req, res) => {
  if (!req.user?.id) return res.status(400).json({ message: "User ID is missing" });
  try {
    res.status(200).json({ total_quantity: await cartRepository.sumQuantityByUser(req.user.id) });
  } catch (error) {
    res.status(500).json({ message: "Error fetching cart total" });
  }
};

const clearCart = async (req, res) => {
  if (!req.user.id) return res.status(400).json({ message: "User ID is missing" });
  try {
    await cartRepository.deleteManyByUser(req.user.id);
    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error clearing cart" });
  }
};

module.exports = {
  clearCart,
  getCart,
  addToCart,
  getCartTotal,
  increaseCartQuantity,
  decreaseCartQuantity,
  removeFromCart,
};
