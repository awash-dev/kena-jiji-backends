const express = require("express");
const {
    createSize,
    updateSize,
    deleteSize,
    getSize,
    getallSize,
} = require("../controllers/sizeController");
const { authMiddleware, isAdmin, isSuperAdminOrAdmin } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/", authMiddleware, isSuperAdminOrAdmin, createSize);
router.put("/:id", authMiddleware, isSuperAdminOrAdmin, updateSize);
router.delete("/:id", authMiddleware, isSuperAdminOrAdmin, deleteSize);
router.get("/:id", getSize);
router.get("/", getallSize);

module.exports = router;