const express = require("express");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const { accessChat, getChats, createGroupChat, renameGroup, addToGroup, removeFromGroup } = require("../controllers/ChatController");

const router = express.Router()

router.route("/").post(authMiddleware, accessChat)
router.route("/").get(authMiddleware,getChats)
router.route("/group").post(authMiddleware, createGroupChat)
router.route("/rename").put(authMiddleware, renameGroup)
router.route("/group/user/add").put(authMiddleware, addToGroup)
router.route("/group/user/remove").put(authMiddleware, removeFromGroup)

module.exports = router;