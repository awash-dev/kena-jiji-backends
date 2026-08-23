const express = require('express');
const { createDocument, deleteImage,updateDocumentStatus, uploadImage,getDocuments} = require('../controllers/documentController');
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");


const router = express.Router();
// NOTE: auth middleware must run BEFORE any controller handler.
router.post('/', authMiddleware, createDocument);
router.post('/upload', authMiddleware, isAdmin, uploadImage);
router.delete('/image/:id', authMiddleware, isAdmin, deleteImage);
router.get("/", getDocuments)
router.put("/:id", authMiddleware, isAdmin, updateDocumentStatus)

module.exports = router;
