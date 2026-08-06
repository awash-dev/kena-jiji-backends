const express = require("express");
const {
    createTag,
    updateTag,
    deleteTag,
    getTag,
    getallTag,
} = require("../controllers/tagController");
const { authMiddleware, isSuperAdminOrAdmin } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/", authMiddleware, isSuperAdminOrAdmin, createTag);
router.put("/:id", authMiddleware, isSuperAdminOrAdmin, updateTag);
router.delete("/:id", authMiddleware, isSuperAdminOrAdmin, deleteTag);
router.get("/:id", getTag);
router.get("/", getallTag);

module.exports = router;