const express = require("express");
const {
    createCategory,
    updateCategory,
    deleteCategory,
    getCategory,
    getallCategory,
} = require("../controllers/ProductCategoryController");
const { authMiddleware, isAdmin, isSuperAdminOrAdmin } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/", authMiddleware, isSuperAdminOrAdmin, createCategory);
router.put("/:id", authMiddleware, isSuperAdminOrAdmin, updateCategory);
router.delete("/:id", authMiddleware, isSuperAdminOrAdmin, deleteCategory);
router.get("/:id", getCategory);
router.get("/", getallCategory);

module.exports = router;