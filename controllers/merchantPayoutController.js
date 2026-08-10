const merchantPayoutRepository = require("../repositories/merchantPayoutRepository");
const orderRepository = require("../repositories/orderRepository");
const notificationRepository = require("../repositories/notificationRepository");

// --- Merchant Endpoints ---

const getMerchantBankAccounts = async (req, res) => {
  try {
    const bankAccounts = await merchantPayoutRepository.getBankAccounts(req.user._id);
    res.status(200).json({ success: true, bankAccounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addMerchantBankAccount = async (req, res) => {
  const { bank_name, account_number, account_holder_name } = req.body;
  if (!bank_name || !account_number || !account_holder_name) {
    return res.status(400).json({ success: false, message: "All bank account fields are required" });
  }
  try {
    const bankAccount = await merchantPayoutRepository.addBankAccount(req.user._id, {
      bank_name,
      account_number,
      account_holder_name,
    });
    res.status(201).json({ success: true, bankAccount, message: "Bank account added successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const setDefaultBankAccount = async (req, res) => {
  const { id } = req.params;
  try {
    const bankAccount = await merchantPayoutRepository.setDefaultBankAccount(req.user._id, id);
    res.status(200).json({ success: true, bankAccount, message: "Default bank account updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteMerchantBankAccount = async (req, res) => {
  const { id } = req.params;
  try {
    await merchantPayoutRepository.deleteBankAccount(req.user._id, id);
    res.status(200).json({ success: true, message: "Bank account deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMerchantCashSales = async (req, res) => {
  try {
    const ledger = await merchantPayoutRepository.getMerchantCashSales(req.user._id);
    res.status(200).json({ success: true, ...ledger });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const requestWithdrawal = async (req, res) => {
  const { amount, bank_name, account_number, account_holder_name } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Valid withdrawal amount is required" });
  }

  try {
    const ledger = await merchantPayoutRepository.getMerchantCashSales(req.user._id);
    if (amount > ledger.availableBalance) {
      return res.status(400).json({
        success: false,
        message: `Requested amount (${amount} ETB) exceeds available balance (${ledger.availableBalance} ETB)`,
      });
    }

    const withdrawal = await merchantPayoutRepository.createWithdrawalRequest(req.user._id, {
      amount,
      bank_name,
      account_number,
      account_holder_name,
    });

    res.status(201).json({
      success: true,
      withdrawal,
      message: "Withdrawal request submitted successfully to Super Admin",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Super Admin Endpoints ---

const getPendingOrdersForAdmin = async (req, res) => {
  try {
    const allOrders = await orderRepository.findAll();
    // Filter orders that need approval (bank_transfer or cod with pending status)
    const pendingOrders = allOrders.filter(
      (o) => o.adminApprovalStatus === "pending_admin_approval" || o.orderStatus === "pending"
    );
    res.status(200).json({ success: true, orders: pendingOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const confirmOrderAdmin = async (req, res) => {
  const { orderId } = req.params;
  try {
    const updatedOrder = await orderRepository.updateById(orderId, {
      admin_approval_status: "approved",
      order_status: "confirmed",
    });

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Notify buyer
    if (updatedOrder.user && updatedOrder.user._id) {
      await notificationRepository.create({
        user_id: updatedOrder.user._id,
        message: `Your order #${updatedOrder.txRef || orderId} has been confirmed by Super Admin!`,
        order_id: orderId,
      });
    }

    res.status(200).json({
      success: true,
      order: updatedOrder,
      message: "Order confirmed and merchant cash sales credited successfully!",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const rejectOrderAdmin = async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  try {
    const updatedOrder = await orderRepository.updateById(orderId, {
      admin_approval_status: "rejected",
      order_status: "cancelled",
    });

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      order: updatedOrder,
      message: "Order rejected",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllWithdrawalRequests = async (req, res) => {
  try {
    const withdrawals = await merchantPayoutRepository.getAllWithdrawals();
    res.status(200).json({ success: true, withdrawals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const approveWithdrawalAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const withdrawal = await merchantPayoutRepository.updateWithdrawalStatus(id, "approved");
    res.status(200).json({
      success: true,
      withdrawal,
      message: "Withdrawal request approved and marked as paid",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const rejectWithdrawalAdmin = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const withdrawal = await merchantPayoutRepository.updateWithdrawalStatus(id, "rejected", reason || "Request rejected by admin");
    res.status(200).json({
      success: true,
      withdrawal,
      message: "Withdrawal request rejected",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};
