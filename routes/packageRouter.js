const express = require("express");
const router = express.Router();
const {
    createPackage,
    updatePackage,
    deletePackage,
    getPackage,
    getAllPackages,
} = require("../controllers/PackageController");
router.post("/", createPackage);
router.put("/:id", updatePackage);
router.delete("/:id", deletePackage);

router.get("/:id", getPackage);

router.get("/", getAllPackages);

module.exports = router;
