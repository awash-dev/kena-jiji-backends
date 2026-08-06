const express = require("express");
const {
    createReport,
    getReport,
    getAllReports,
    updateReport,
    deleteReport,
} = require("../controllers/ReportController");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const router = express.Router();
router.post("/", authMiddleware, createReport);
router.get("/:id", authMiddleware, getReport);
router.get("/", authMiddleware, getAllReports);
router.put("/:id", authMiddleware, isAdmin, updateReport);
router.delete("/:id", authMiddleware, isAdmin, deleteReport);

module.exports = router;
