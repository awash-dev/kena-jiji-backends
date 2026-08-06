const userRepository = require("../../../repositories/userRepository");
const orderRepository = require("../../../repositories/orderRepository");
const { hashPassword } = require("../../../services/passwordService");

const createUser = async (req, res) => {
  const { firstname, lastname, email, password, mobile, role } = req.body;
  const existingUser = await userRepository.findOneByEmail(email);
  if (existingUser) return res.status(400).json({ message: "User already exists." });

  await userRepository.create({
    firstname,
    lastname,
    email,
    password: await hashPassword(password),
    mobile,
    role,
  });

  res.status(201).json({ success: true, message: "User created successfully." });
};

const getDeliveryBoys = async (req, res) => {
  res.set("Cache-Control", "no-store");
  res.status(200).json(await userRepository.findByRole("deliveryBoy"));
};

const getAssignedOrders = async (req, res) => {
  try {
    const orders = (await orderRepository.findAll()).filter(
      (order) => (order.assignedTo?._id || order.assignedTo) === req.params.deliveryPersonId
    );
    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateDeliveryBoy = async (req, res) => {
  const updatedDeliveryBoy = await userRepository.updateById(req.params.id, {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    mobile: req.body.mobile,
    role: req.body.role,
    address: req.body.address,
    is_active: req.body.isActive,
    is_blocked: req.body.isBlocked,
  });
  res.status(200).json(updatedDeliveryBoy);
};

const deleteDeliveryBoy = async (req, res) => {
  await userRepository.deleteById(req.params.id);
  res.status(204).json({ message: "Delivery boy deleted successfully." });
};

const updateOrderStatus = async (req, res) => {
  try {
    const order = await orderRepository.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    const updated = await orderRepository.updateById(req.params.orderId, { order_status: req.body.status });
    res.status(200).json({ message: "Order status updated successfully", order: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const getDeliveryBoyById = async (req, res) => {
  try {
    const deliveryBoy = await userRepository.findById(req.params.id);
    if (!deliveryBoy || deliveryBoy.role !== "deliveryBoy") {
      return res.status(404).json({ message: "Delivery boy not found." });
    }
    res.status(200).json(deliveryBoy);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const activateUser = async (req, res) => {
  try {
    const user = await userRepository.updateById(req.params.id, { is_active: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User activated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deactivateDeliveryPerson = async (req, res) => {
  try {
    const user = await userRepository.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Delivery person not found" });
    if (user.role !== "deliveryBoy") {
      return res.status(400).json({ message: "User is not a delivery person" });
    }
    const updated = await userRepository.updateById(req.params.id, { is_active: false });
    res.status(200).json({ message: "Delivery person deactivated successfully", user: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { createUser, getDeliveryBoys, getAssignedOrders, updateDeliveryBoy, deleteDeliveryBoy, updateOrderStatus, getDeliveryBoyById, activateUser, deactivateDeliveryPerson };
