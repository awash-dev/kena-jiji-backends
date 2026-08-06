const express = require("express");
const {
    getNotifications,
    clearNotifications,
    addNotification,
    markNotificationsAsRead,
    markAsRead,
} = require("../controllers/notificationController.js");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getNotifications);
router.post("/clear", authMiddleware, clearNotifications);
router.post("/add", authMiddleware, addNotification);
router.put("/mark-as-read", authMiddleware, markNotificationsAsRead);
router.put("/:notificationId/read", authMiddleware, markAsRead);

module.exports = router;