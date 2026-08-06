const deliveryAssignmentRepository = require("../repositories/deliveryAssignmentRepository");
const orderRepository = require("../repositories/orderRepository");

const getAssignedOrders = async (req, res) => {
  try {
    const assignments = await deliveryAssignmentRepository.findByDeliveryBoy(req.user._id);
    const orders = await Promise.all(assignments.map((assignment) => orderRepository.findById(assignment.orderId)));
    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: "Error fetching assigned orders", error });
  }
};

const markOrderDelivered = async (req, res) => {
  try {
    const assignment = await deliveryAssignmentRepository.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });
    if (assignment.deliveryBoy !== req.user._id) {
      return res.status(403).json({ message: "Not authorized to update this order" });
    }

    const updatedAssignment = await deliveryAssignmentRepository.updateById(req.params.id, {
      status: "delivered",
      delivered_at: new Date(),
    });

    res.status(200).json({ message: "Order marked as delivered", assignment: updatedAssignment });
  } catch (error) {
    res.status(500).json({ message: "Error marking order as delivered", error });
  }
};

module.exports = { getAssignedOrders, markOrderDelivered };
