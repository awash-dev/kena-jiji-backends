const express = require("express");
const router = express.Router();
const {
    createPackage,
    updatePackage,
    deletePackage,
    getPackage,
    getAllPackages,
} = require("../controllers/PackageController");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

router.post("/", authMiddleware, isAdmin, createPackage);
router.put("/:id", authMiddleware, isAdmin, updatePackage);
router.delete("/:id", authMiddleware, isAdmin, deletePackage);

router.get("/:id", getPackage);

router.get("/", getAllPackages);

module.exports = router;
