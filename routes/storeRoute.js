const express = require("express");
const {
    createStore,     
    updateStore,   
    deleteStore,     
    getStore,        
    getallStore,     
    getStoresByUser,
} = require("../controllers/StoreController");

const { authMiddleware, isSuperAdminOrMerchant } = require("../middlewares/authMiddleware");

const router = express.Router();
router.post("/",  createStore);
router.get("/:id", getStore);
router.get("/storeList/:id", getStoresByUser);
router.put("/:id",authMiddleware, isSuperAdminOrMerchant, updateStore);
router.delete("/:id", authMiddleware, isSuperAdminOrMerchant, deleteStore);


router.get("/", getallStore);

module.exports = router;
