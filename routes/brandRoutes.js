const express = require("express");

const {
    createBrand,
    updateBrand,
    deleteBrand,
    getBrand,
    getallBrand,
} = require("../controllers/brandController")

const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", createBrand);
router.put("/:id", updateBrand);
router.delete("/:id", deleteBrand);
router.get("/:id", getBrand);
router.get("/", getallBrand)

module.exports = router;