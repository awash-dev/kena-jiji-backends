const express = require("express");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { sendMessage, getMessages } = require("../controllers/messageController");

const router = express.Router();

router.route("/").post( authMiddleware  ,sendMessage);
router.route("/:id").get( authMiddleware  ,getMessages);


module.exports = router;