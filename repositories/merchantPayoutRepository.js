const db = require("../configure/wubFashionDB");
const { serializeRow, serializeRows } = require("../services/sqlHelpers");
const { v4: uuidv4 } = require("uuid");

let tablesEnsured = false;
const ensureTablesExist = async () => {
  if (tablesEnsured) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS merchant_bank_accounts (
        id VARCHAR(255) PRIMARY KEY,
        merchant_id VARCHAR(255) NOT NULL,
        bank_name VARCHAR(255) NOT NULL,
        account_number VARCHAR(255) NOT NULL,
        account_holder_name VARCHAR(255) NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE merchant_bank_accounts ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

      CREATE TABLE IF NOT EXISTS merchant_withdrawals (
        id VARCHAR(255) PRIMARY KEY,
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

      ALTER TABLE merchant_withdrawals ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
    `);
    tablesEnsured = true;
  } catch (e) {
    console.error("Error creating/altering merchant payout tables:", e.message);
  }
};

// Merchant Bank Account Methods
const getBankAccounts = async (merchantId) => {
  await ensureTablesExist();
  try {
    const result = await db.query(
      "SELECT * FROM merchant_bank_accounts WHERE merchant_id = $1 ORDER BY created_at DESC",
      [String(merchantId)]
    );
    return serializeRows(result.rows);
  } catch (e) {
    console.error("getBankAccounts SQL Error:", e.message);
    return [];
  }
};

const addBankAccount = async (merchantId, { bank_name, account_number, account_holder_name }) => {
  await ensureTablesExist();
  try {
    const countRes = await db.query("SELECT COUNT(*) FROM merchant_bank_accounts WHERE merchant_id = $1", [String(merchantId)]);
    const count = parseInt(countRes.rows[0]?.count || "0", 10);
    const isDefault = count === 0;
    const id = uuidv4();
    
    const result = await db.query(
      `INSERT INTO merchant_bank_accounts (id, merchant_id, bank_name, account_number, account_holder_name, is_default)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, String(merchantId), String(bank_name), String(account_number), String(account_holder_name), isDefault]
    );
    return serializeRow(result.rows[0]);
  } catch (e) {
    console.error("addBankAccount SQL Error:", e.message);
    throw e;
  }
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

// Revenue breakdown per merchant, derived from order carts.
const getAllMerchantRevenue = async () => {
  const ordersResult = await db.query(
    `SELECT id, cart, created_at FROM orders ORDER BY created_at DESC`
  );
  const orders = serializeRows(ordersResult.rows);

  const revenueMap = new Map();
  for (const order of orders) {
    const cartItems = Array.isArray(order.cart) ? order.cart : [];
    for (const item of cartItems) {
      const merchantId =
        item.product?.postedbyuserid || item.postedbyuserid || item.merchantId || item.store?.owner_id;
      if (!merchantId) continue;
      const key = String(merchantId);
      if (!revenueMap.has(key)) {
        revenueMap.set(key, { merchantId: key, revenue: 0, orderIds: new Set(), items: 0 });
      }
      const entry = revenueMap.get(key);
      entry.revenue += Number(item.price || item.product?.price || 0) * Number(item.quantity || 1);
      entry.orderIds.add(String(order.id));
      entry.items += 1;
    }
  }

  const merchantIds = Array.from(revenueMap.keys());
  let merchants = [];
  if (merchantIds.length > 0) {
    const storeRes = await db.query(
      `SELECT owner_id, store_name FROM stores WHERE owner_id = ANY($1::uuid[])`,
      [merchantIds]
    );
    const nameByOwner = new Map(storeRes.rows.map((r) => [String(r.owner_id), r.store_name]));
    merchants = Array.from(revenueMap.values())
      .map((m) => ({
        merchantId: m.merchantId,
        storeName: nameByOwner.get(m.merchantId) || "Unknown store",
        revenue: Number(m.revenue.toFixed(2)),
        orders: m.orderIds.size,
        items: m.items,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  return merchants;
};

// Withdrawal Requests
const createWithdrawalRequest = async (merchantId, { amount, bank_name, account_number, account_holder_name }) => {
  const id = uuidv4();
  const result = await db.query(
    `INSERT INTO merchant_withdrawals (id, merchant_id, amount, bank_name, account_number, account_holder_name, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending')
     RETURNING *`,
    [id, String(merchantId), amount, bank_name, account_number, account_holder_name]
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
  getAllMerchantRevenue,
  createWithdrawalRequest,
  getWithdrawalById,
  getAllWithdrawals,
  updateWithdrawalStatus,
};
