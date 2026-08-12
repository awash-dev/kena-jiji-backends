const db = require("../configure/wubFashionDB");
const { serializeRow, serializeRows } = require("../services/sqlHelpers");

let tablesEnsured = false;
const ensureTablesExist = async () => {
  if (tablesEnsured) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS merchant_bank_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id VARCHAR(255) NOT NULL,
        bank_name VARCHAR(255) NOT NULL,
        account_number VARCHAR(255) NOT NULL,
        account_holder_name VARCHAR(255) NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS merchant_withdrawals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id VARCHAR(255) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        bank_name VARCHAR(255) NOT NULL,
        account_number VARCHAR(255) NOT NULL,
        account_holder_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        rejection_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    tablesEnsured = true;
  } catch (e) {
    console.error("Error creating merchant payout tables:", e.message);
  }
};

// Merchant Bank Account Methods
const getBankAccounts = async (merchantId) => {
  await ensureTablesExist();
  const result = await db.query(
    "SELECT * FROM merchant_bank_accounts WHERE merchant_id = $1 ORDER BY created_at DESC",
    [String(merchantId)]
  );
  return serializeRows(result.rows);
};

const addBankAccount = async (merchantId, { bank_name, account_number, account_holder_name }) => {
  await ensureTablesExist();
  // Check if they have any accounts, if not make this one default
  const countRes = await db.query("SELECT COUNT(*) FROM merchant_bank_accounts WHERE merchant_id = $1", [String(merchantId)]);
  const isDefault = countRes.rows[0].count === '0';
  
  const result = await db.query(
    `INSERT INTO merchant_bank_accounts (merchant_id, bank_name, account_number, account_holder_name, is_default)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [String(merchantId), bank_name, account_number, account_holder_name, isDefault]
  );
  return serializeRow(result.rows[0]);
};

const setDefaultBankAccount = async (merchantId, accountId) => {
  // set all to false
  await db.query("UPDATE merchant_bank_accounts SET is_default = FALSE WHERE merchant_id = $1", [merchantId]);
  // set target to true
  const result = await db.query("UPDATE merchant_bank_accounts SET is_default = TRUE WHERE merchant_id = $1 AND id = $2 RETURNING *", [merchantId, accountId]);
  return serializeRow(result.rows[0]);
};

const deleteBankAccount = async (merchantId, accountId) => {
  await db.query("DELETE FROM merchant_bank_accounts WHERE merchant_id = $1 AND id = $2", [merchantId, accountId]);
  
  // if no default exists but they still have accounts, set oldest as default
  const checkRes = await db.query("SELECT id FROM merchant_bank_accounts WHERE merchant_id = $1 AND is_default = TRUE", [merchantId]);
  if (checkRes.rows.length === 0) {
    await db.query(`
      UPDATE merchant_bank_accounts SET is_default = TRUE 
      WHERE id = (SELECT id FROM merchant_bank_accounts WHERE merchant_id = $1 ORDER BY created_at ASC LIMIT 1)
    `, [merchantId]);
  }
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
  getBankAccounts,
  addBankAccount,
  setDefaultBankAccount,
  deleteBankAccount,
  getMerchantCashSales,
  createWithdrawalRequest,
  getWithdrawalById,
  getAllWithdrawals,
  updateWithdrawalStatus,
};
