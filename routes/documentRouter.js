const express = require('express');
const { createDocument, deleteImage,updateDocumentStatus, uploadImage,getDocuments} = require('../controllers/documentController');
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");


const router = express.Router();
router.post('/', createDocument );
router.post('/upload', uploadImage,authMiddleware, isAdmin );
router.delete('/image/:id', deleteImage,authMiddleware, isAdmin );
router.get("/",getDocuments)
router.put("/:id", updateDocumentStatus,authMiddleware, isAdmin )

module.exports = router;
