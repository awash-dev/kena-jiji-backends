const express = require("express");
const router = express.Router();
const {
  getMerchantBankAccounts,
  addMerchantBankAccount,
  setDefaultBankAccount,
  deleteMerchantBankAccount,
  getMerchantCashSales,
  requestWithdrawal,
  getPendingOrdersForAdmin,
  confirmOrderAdmin,
  rejectOrderAdmin,
  getAllWithdrawalRequests,
  approveWithdrawalAdmin,
  rejectWithdrawalAdmin,
} = require("../controllers/merchantPayoutController");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

// Merchant Routes
router.get("/bank-account", authMiddleware, getMerchantBankAccounts);
router.post("/bank-account", authMiddleware, addMerchantBankAccount);
router.put("/bank-account/:id/default", authMiddleware, setDefaultBankAccount);
router.delete("/bank-account/:id", authMiddleware, deleteMerchantBankAccount);
router.get("/cash-sales", authMiddleware, getMerchantCashSales);
router.post("/withdrawals", authMiddleware, requestWithdrawal);

// Super Admin Order Approval Routes
router.get("/admin/orders/pending", authMiddleware, isAdmin, getPendingOrdersForAdmin);
router.put("/admin/orders/:orderId/confirm", authMiddleware, isAdmin, confirmOrderAdmin);
router.put("/admin/orders/:orderId/reject", authMiddleware, isAdmin, rejectOrderAdmin);

// Super Admin Payout Withdrawal Routes
router.get("/admin/withdrawals", authMiddleware, isAdmin, getAllWithdrawalRequests);
router.put("/admin/withdrawals/:id/approve", authMiddleware, isAdmin, approveWithdrawalAdmin);
router.put("/admin/withdrawals/:id/reject", authMiddleware, isAdmin, rejectWithdrawalAdmin);

module.exports = router;
