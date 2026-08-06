const express = require("express");
const {
    createColor,
    updateColor,
    deleteColor,
    getColor,
    getallColor,
    getColorsByIds
} = require("../controllers/colorController");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/", createColor);
router.put("/:id", authMiddleware, isAdmin, updateColor);
router.delete("/:id", authMiddleware, isAdmin, deleteColor);
router.get("/:id", getColor);
router.post('/byIds', getColorsByIds);
router.get("/", getallColor);

module.exports = router;