const notificationRepository = require("../repositories/notificationRepository");

const markAsRead = async (req, res) => {
  try {
    await notificationRepository.markAsRead(req.params.notificationId);
    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark notification as read", error });
  }
};

const getNotifications = async (req, res) => {
  try {
    res.status(200).json(await notificationRepository.findByUser(req.user._id));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications", error });
  }
};

const clearNotifications = async (req, res) => {
  try {
    await notificationRepository.clearByUser(req.user._id);
    res.status(200).json({ message: "Notifications cleared" });
  } catch (error) {
    res.status(500).json({ message: "Failed to clear notifications", error });
  }
};

const addNotification = async (req, res) => {
  try {
    const notification = await notificationRepository.create({
      user_id: req.user._id,
      message: req.body.message,
      order_id: req.body.order,
      product_id: req.body.product,
    });
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: "Failed to add notification", error });
  }
};

const markNotificationsAsRead = async (req, res) => {
  try {
    await notificationRepository.markAllAsRead(req.user.id);
    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark notifications as read", error });
  }
};

module.exports = { markAsRead, getNotifications, clearNotifications, addNotification, markNotificationsAsRead };
