const express = require("express");
const {
    createStore,     
    updateStore,   
    deleteStore,     
    getStore,        
    getallStore,     
    getStoresByUser,
} = require("../controllers/StoreController");

const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();
router.post("/",  createStore);
router.get("/:id", getStore);
router.get("/storeList/:id", getStoresByUser);
router.put("/:id",authMiddleware, isAdmin,updateStore);
router.delete("/:id", authMiddleware, isAdmin, deleteStore);


router.get("/", getallStore);

module.exports = router;
