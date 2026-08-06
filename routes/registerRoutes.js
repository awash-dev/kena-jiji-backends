const express = require("express");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const { registerUser } = require("../controllers/registerController");  

const router = express.Router();

router.post("/register", authMiddleware, isAdmin, registerUser);  

module.exports = router;
