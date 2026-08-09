const db = require("../configure/wubFashionDB");
const { serializeRow, serializeRows } = require("../services/sqlHelpers");

// Merchant Bank Account Methods
const getBankAccount = async (merchantId) => {
  const result = await db.query(
    "SELECT * FROM merchant_bank_accounts WHERE merchant_id = $1",
    [merchantId]
  );
  return serializeRow(result.rows[0]);
};

const upsertBankAccount = async (merchantId, { bank_name, account_number, account_holder_name }) => {
  const result = await db.query(
    `INSERT INTO merchant_bank_accounts (merchant_id, bank_name, account_number, account_holder_name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (merchant_id)
     DO UPDATE SET bank_name = EXCLUDED.bank_name, account_number = EXCLUDED.account_number, account_holder_name = EXCLUDED.account_holder_name, updated_at = NOW()
     RETURNING *`,
    [merchantId, bank_name, account_number, account_holder_name]
  );
  return serializeRow(result.rows[0]);
};

// Merchant Sales Ledger & Earnings
const getMerchantCashSales = async (merchantId) => {
  // Query all orders confirmed by Super Admin
  const result = await db.query(
    `SELECT * FROM orders WHERE admin_approval_status = 'approved' ORDER BY created_at DESC`
  );
  const orders = serializeRows(result.rows);

  const confirmedSales = [];
  let totalEarnings = 0;

  for (const order of orders) {
    const cartItems = Array.isArray(order.cart) ? order.cart : [];
    for (const item of cartItems) {
      // Check if product belongs to this merchant (postedbyuserid or store owner)
      const postedBy = item.product?.postedbyuserid || item.postedbyuserid || item.merchantId;
      if (String(postedBy) === String(merchantId)) {
        const itemTotal = (item.price || item.product?.price || 0) * (item.quantity || 1);
        totalEarnings += itemTotal;
        confirmedSales.push({
          orderId: order._id,
          txRef: order.txRef,
          customerName: `${order.firstName || ''} ${order.lastName || ''}`.trim(),
          productTitle: item.product?.title || item.title || "Product",
          quantity: item.quantity || 1,
          price: item.price || item.product?.price || 0,
          subtotal: itemTotal,
          paymentMethod: order.paymentMethod || 'chapa',
          confirmedAt: order.updatedAt,
        });
      }
    }
  }

  // Get total requested / approved withdrawals
  const withdrawalsResult = await db.query(
    "SELECT * FROM merchant_withdrawals WHERE merchant_id = $1 ORDER BY created_at DESC",
    [merchantId]
  );
  const withdrawals = serializeRows(withdrawalsResult.rows);

  let totalWithdrawn = 0;
  let pendingWithdrawal = 0;

  for (const w of withdrawals) {
    if (w.status === "approved") {
      totalWithdrawn += Number(w.amount || 0);
    } else if (w.status === "pending") {
      pendingWithdrawal += Number(w.amount || 0);
    }
  }

  const availableBalance = Math.max(0, totalEarnings - totalWithdrawn - pendingWithdrawal);

  return {
    totalEarnings,
    totalWithdrawn,
    pendingWithdrawal,
    availableBalance,
    confirmedSales,
    withdrawals,
  };
};

// Withdrawal Requests
const createWithdrawalRequest = async (merchantId, { amount, bank_name, account_number, account_holder_name }) => {
  const result = await db.query(
    `INSERT INTO merchant_withdrawals (merchant_id, amount, bank_name, account_number, account_holder_name, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     RETURNING *`,
    [merchantId, amount, bank_name, account_number, account_holder_name]
  );
  return serializeRow(result.rows[0]);
};

const getWithdrawalById = async (id) => {
  const result = await db.query("SELECT * FROM merchant_withdrawals WHERE id = $1", [id]);
  return serializeRow(result.rows[0]);
};

const getAllWithdrawals = async () => {
  const result = await db.query(
    `SELECT w.*, u.firstname AS merchant_firstname, u.lastname AS merchant_lastname, u.email AS merchant_email, u.mobile AS merchant_mobile
     FROM merchant_withdrawals w
     LEFT JOIN users u ON u.id = w.merchant_id
     ORDER BY w.created_at DESC`
  );
  return serializeRows(result.rows);
};

const updateWithdrawalStatus = async (id, status, rejectionReason = null) => {
  const result = await db.query(
    `UPDATE merchant_withdrawals
     SET status = $1, rejection_reason = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [status, rejectionReason, id]
  );
  return serializeRow(result.rows[0]);
};

module.exports = {
  getBankAccount,
  upsertBankAccount,
  getMerchantCashSales,
  createWithdrawalRequest,
  getWithdrawalById,
  getAllWithdrawals,
  updateWithdrawalStatus,
};
