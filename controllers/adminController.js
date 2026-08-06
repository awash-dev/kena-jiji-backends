const deliveryAssignmentRepository = require("../repositories/deliveryAssignmentRepository");

exports.assignDeliveryBoy = async (req, res) => {
  try {
    const assignment = await deliveryAssignmentRepository.create({
      order_id: req.body.orderId,
      delivery_boy: req.body.deliveryBoyId,
    });
    res.status(200).json({ message: "Delivery boy assigned", assignment });
  } catch (error) {
    res.status(500).json({ message: "Error assigning delivery boy", error });
  }
};
