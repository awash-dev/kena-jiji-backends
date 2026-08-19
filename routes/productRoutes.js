const express = require("express");
const {
    createProduct,
    getaProduct,
    getAllProduct,
    updateProduct,
    deleteProduct,
    addToWishlist,
    rating,
    //new 
    getStoreProducts,
    getProductCountByCategory,
    fetchRecentProducts,
    EachMerchantProducts,
    AllGetProductCountByCategory,
    AllfetchRecentProducts,
    NotApprovedProducts,
    RejectedProducts,
    AllMerchantProducts,
    getProductsByCategory,

} = require("../controllers/productController");
const { isAdmin, isSuperAdminOrAdmin, isSuperAdminOrMerchant, isSuperAdminOrMerchantOrAdmin, authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();


//new 
router.get("/MerchantdashBoard", AllGetProductCountByCategory);
router.get("/MerchantdashBoard/:id", getProductCountByCategory)
router.get('/recent', AllfetchRecentProducts);
router.get('/recent/:id', fetchRecentProducts);
router.get('/AllProduct/:id', EachMerchantProducts);
router.get("/store/:id", getStoreProducts);
router.get('/NotApproved', authMiddleware, isSuperAdminOrAdmin, NotApprovedProducts);
router.get('/Rejected', authMiddleware, isSuperAdminOrAdmin, RejectedProducts);
router.get('/category/:category', getProductsByCategory);



router.post("/", authMiddleware, createProduct);

router.get("/:id", getaProduct);

router.put("/wishlist", authMiddleware, addToWishlist);
router.put("/rating", authMiddleware, rating);

router.put("/:id", authMiddleware, isSuperAdminOrMerchant, updateProduct);
router.delete("/:id", authMiddleware, isSuperAdminOrMerchantOrAdmin, deleteProduct);

router.get("/", getAllProduct);



module.exports = router;