const express = require("express");
const {
  createUser,
  createAppUser,
  verifyEmail,
  resendOtp,
  forgotPassword,
  verifyOTP,
  resetPassword,
  loginUserCtrl,
  getallUser,
  getaUser,
  deleteaUser,
  updatedUser,
  blockUser,
  unblockUser,
  handleRefreshToken,
  logout,
  updatePassword,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  saveAddress,
  userCart,
  getUserCart,
  removeProductFromCart,
  updateProductQuantityFromCart,
  getMyOrders,
  emptyCart,
  getMonthWiseOrderIncome,
  getMonthWiseOrderCount,
  getYearlyTotalOrder,
  getAllOrders,
  getsingleOrder,
  updateOrder,
  getDeliveryBoys,
  assignOrderToDeliveryBoy,
  updateDeliveryBoy,
  deleteDeliveryBoy,
  // new 
  changePassword,
  getUsersByRole,
  getUserCount,
  changeUserRole,

} = require("../controllers/userController");
const { authMiddleware, isAdmin, isSuperAdmin, isSuperAdminOrAdmin, isAdminSuperAdminOrMerchant, isSuperAdminOrMerchant, isSuperAdminOrMerchantOrAdmin } = require("../middlewares/authMiddleware");
const {
  getMerchantApplications,
  approveMerchantApplication,
  rejectMerchantApplication,
} = require("../controllers/documentController");
//const { checkout, paymentVerification } = require("../controller/paymentCtrl");
const router = express.Router();

router.get("/getallorders", authMiddleware, isSuperAdminOrAdmin, getAllOrders);
router.get("/all-users", authMiddleware, isSuperAdminOrAdmin, getallUser);
router.get("/getmyorders", authMiddleware, getMyOrders);

router.get("/merchant-applications", authMiddleware, isSuperAdminOrAdmin, getMerchantApplications);
router.put("/approve-merchant/:id", authMiddleware, isSuperAdminOrAdmin, approveMerchantApplication);
router.put("/reject-merchant/:id", authMiddleware, isSuperAdminOrAdmin, rejectMerchantApplication);

router.get("/getMonthWiseOrderIncome", authMiddleware, isSuperAdminOrAdmin, getMonthWiseOrderIncome);
router.get("/getyearlyorders", authMiddleware, isSuperAdminOrAdmin, getYearlyTotalOrder);

router.put('/changepassword/:token', changePassword);
router.get("/userList", authMiddleware, isSuperAdminOrAdmin, getUsersByRole);
router.get("/userCounts", authMiddleware, isSuperAdminOrAdmin, getUserCount);
router.get("/:id", getaUser);
router.put("/:id", updatedUser);

// Super Admin only: change a user's role
router.put("/role/:id", authMiddleware, isSuperAdmin, changeUserRole);

router.post("/register", createUser);
router.post("/appRegister", createAppUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOtp);

router.put("/ForgotPassword", forgotPassword);
router.post("/verify-otp", verifyOTP);


router.post("/reset-password", resetPassword);
router.put("/password", authMiddleware, updatePassword);
router.post("/login", loginUserCtrl);
router.post("/cart", authMiddleware, userCart);
router.post("/wishlist", authMiddleware, addToWishlist);



router.get("/getaOrder/:id", authMiddleware, isAdminSuperAdminOrMerchant, getsingleOrder);
router.put("/updateOrder/:id", authMiddleware, isSuperAdminOrAdmin, updateOrder);

router.get("/refresh", handleRefreshToken);
router.get("/logout", logout);
router.get("/wishlist", authMiddleware, getWishlist);
router.get("/cart", authMiddleware, getUserCart);



router.delete(
  "/delete-product-cart/:cartItemId",
  authMiddleware,
  removeProductFromCart
);
router.delete(
  "/update-product-cart/:cartItemId/:newQuantity",
  authMiddleware,
  updateProductQuantityFromCart
);

router.delete("/remove-wishlist/:id", authMiddleware, removeFromWishlist); // protect middleware is used for authentication

router.delete("/empty-cart", authMiddleware, emptyCart);

router.delete("/:id", deleteaUser);

router.put("/edit-user", authMiddleware, updatedUser);
router.put("/save-address", authMiddleware, saveAddress);
router.put("/block-user/:id", authMiddleware, isSuperAdminOrAdmin, blockUser);
router.put("/unblock-user/:id", authMiddleware, isSuperAdminOrAdmin, unblockUser);







module.exports = router;
