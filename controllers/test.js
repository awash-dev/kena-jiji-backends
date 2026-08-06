const orderRepository = require("../repositories/orderRepository");
const userRepository = require("../repositories/userRepository");

const assignDeliveryBoy = async (req, res) => {
  try {
    const deliveryBoy = await userRepository.findById(req.body.deliveryBoyId);
    if (!deliveryBoy) return res.status(404).json({ message: "Delivery boy not found" });

    const order = await orderRepository.updateById(req.params.orderId, {
      assigned_to: req.body.deliveryBoyId,
      order_status: "Assigned",
    });

    if (!order) return res.status(404).json({ message: "Order not found" });
    res.status(200).json({ message: "Delivery boy assigned successfully", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { assignDeliveryBoy };
