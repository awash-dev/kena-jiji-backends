const express = require("express");
const {
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    getSubcategory,
    getallSubcategory,
} = require("../controllers/productSubcategoryController");
const { authMiddleware, isSuperAdminOrAdmin } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/", authMiddleware, isSuperAdminOrAdmin, createSubcategory);
router.put("/:id", authMiddleware, isSuperAdminOrAdmin, updateSubcategory);
router.delete("/:id", authMiddleware, isSuperAdminOrAdmin, deleteSubcategory);
router.get("/:id", getSubcategory);
router.get("/", getallSubcategory);

module.exports = router;
