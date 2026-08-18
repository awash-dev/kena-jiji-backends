const express = require("express");
const router = express.Router();
const {
  getMerchantBankAccounts,
  addMerchantBankAccount,
  setDefaultBankAccount,
  deleteMerchantBankAccount,
  getMerchantCashSales,
  getAllMerchantRevenue,
  requestWithdrawal,
  getPendingOrdersForAdmin,
  confirmOrderAdmin,
  rejectOrderAdmin,
  getAllWithdrawalRequests,
  approveWithdrawalAdmin,
  rejectWithdrawalAdmin,
} = require("../controllers/merchantPayoutController");
const { authMiddleware, isSuperAdminOrAdmin } = require("../middlewares/authMiddleware");

// Merchant Routes
router.get("/bank-account", authMiddleware, getMerchantBankAccounts);
router.post("/bank-account", authMiddleware, addMerchantBankAccount);
router.put("/bank-account/:id/default", authMiddleware, setDefaultBankAccount);
router.delete("/bank-account/:id", authMiddleware, deleteMerchantBankAccount);
router.get("/cash-sales", authMiddleware, getMerchantCashSales);
router.post("/withdrawals", authMiddleware, requestWithdrawal);

// Super Admin Order Approval Routes
router.get("/admin/orders/pending", authMiddleware, isSuperAdminOrAdmin, getPendingOrdersForAdmin);
router.put("/admin/orders/:orderId/confirm", authMiddleware, isSuperAdminOrAdmin, confirmOrderAdmin);
router.put("/admin/orders/:orderId/reject", authMiddleware, isSuperAdminOrAdmin, rejectOrderAdmin);

// Super Admin Payout Withdrawal Routes
router.get("/admin/withdrawals", authMiddleware, isSuperAdminOrAdmin, getAllWithdrawalRequests);
router.put("/admin/withdrawals/:id/approve", authMiddleware, isSuperAdminOrAdmin, approveWithdrawalAdmin);
router.put("/admin/withdrawals/:id/reject", authMiddleware, isSuperAdminOrAdmin, rejectWithdrawalAdmin);

// Super Admin Merchant Revenue
router.get("/admin/merchant-revenue", authMiddleware, isSuperAdminOrAdmin, getAllMerchantRevenue);

module.exports = router;
