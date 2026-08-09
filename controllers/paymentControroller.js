const dotenv = require("dotenv");
const axios = require("axios");
const orderRepository = require("../repositories/orderRepository");
const notificationRepository = require("../repositories/notificationRepository");

dotenv.config();

const initializePayment = async (req, res) => {
  const {
    totalPrice,
    currency,
    email,
    first_name,
    tx_ref,
    last_name,
    phone_number,
    address,
    country,
    city,
    postalCode,
    totalPriceAfterDiscount,
    cart,
    paymentMethod = "chapa",
    bankReceiptUrl,
  } = req.body;

  try {
    // 1. Cash on Delivery (COD) or Bank Transfer Direct Placement
    if (paymentMethod === "cod" || paymentMethod === "bank_transfer") {
      const newOrder = await orderRepository.create({
        user_id: req.user._id,
        currency: currency || "ETB",
        first_name,
        last_name,
        email,
        phone_number,
        address,
        city,
        postal_code: postalCode || 1000,
        tx_ref: tx_ref || `TX-${Date.now()}`,
        cart,
        country: country || "Ethiopia",
        total_price: totalPrice,
        total_price_after_discount: totalPriceAfterDiscount || totalPrice,
        order_status: "pending",
        payment_method: paymentMethod,
        bank_receipt_url: bankReceiptUrl || null,
        admin_approval_status: "pending_admin_approval",
        payment_info: {
          method: paymentMethod,
          bankReceiptUrl: bankReceiptUrl || null,
        },
      });

      await notificationRepository.create({
        user_id: req.user._id,
        message: `New ${paymentMethod.toUpperCase()} order created with ref: ${newOrder.txRef}`,
        order_id: newOrder._id,
      });

      return res.status(200).json({
        success: true,
        message: "Order placed successfully! Awaiting Super Admin confirmation.",
        order: newOrder,
        payment_url: null,
      });
    }

    // 2. Chapa Online Payment Flow
    const chapaResponse = await axios.post(
      "https://api.chapa.co/v1/transaction/initialize",
      {
        amount: totalPrice,
        currency: "ETB",
        tx_ref,
        callback_url: "http://localhost:4000/api/payment/verify",
        return_url: "http://localhost:3000/payment/success",
        first_name,
        last_name,
        email,
        phone_number,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (chapaResponse.data.status !== "success") {
      return res.status(400).json({ message: "Payment initialization failed" });
    }

    const newOrder = await orderRepository.create({
      user_id: req.user._id,
      currency: currency || "ETB",
      first_name,
      last_name,
      email,
      phone_number,
      address,
      city,
      postal_code: postalCode || 1000,
      tx_ref,
      cart,
      country: country || "Ethiopia",
      total_price: totalPrice,
      total_price_after_discount: totalPriceAfterDiscount || totalPrice,
      order_status: "pending",
      payment_method: "chapa",
      admin_approval_status: "approved",
      payment_info: {},
    });

    await notificationRepository.create({
      user_id: req.user._id,
      message: `New order created with ref: ${newOrder.txRef}`,
      order_id: newOrder._id,
    });

    res.status(200).json({ success: true, payment_url: chapaResponse.data.data.checkout_url, order: newOrder });
  } catch (error) {
    res.status(500).json({
      message: "Payment failed",
      error: error.response ? error.response.data : error.message,
    });
  }
};

const verifyPayment = async (req, res) => {
  const { tx_ref } = req.query;

  try {
    const verifyResponse = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        },
      }
    );

    if (verifyResponse.data.status !== "success") {
      return res.status(400).json({ message: "Payment verification failed", success: false });
    }

    const orders = await orderRepository.findAll();
    const order = orders.find((item) => item.txRef === tx_ref);
    const updatedOrder = order
      ? await orderRepository.updateById(order._id, { order_status: "completed", admin_approval_status: "approved" })
      : null;

    res.status(200).json({
      message: "Payment verified successfully",
      order: updatedOrder,
      success: true,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { verifyPayment, initializePayment };
