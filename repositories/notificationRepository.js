const db = require("../configure/wubFashionDB");
const { serializeRow, serializeRows } = require("../services/sqlHelpers");

const create = async ({ user_id, message, product_id, order_id }) => {
  const result = await db.query(
    `
      INSERT INTO notifications (user_id, message, product_id, order_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [user_id, message, product_id || null, order_id || null]
  );
  return serializeRow(result.rows[0]);
};

const findByUser = async (userId) => {
  const result = await db.query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return serializeRows(result.rows);
};

const markAsRead = async (notificationId) => {
  const result = await db.query(
    `UPDATE notifications SET read = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [notificationId]
  );
  return serializeRow(result.rows[0]);
};

const markAllAsRead = async (userId) => {
  const result = await db.query(
    `UPDATE notifications SET read = TRUE, updated_at = NOW() WHERE user_id = $1 AND read = FALSE RETURNING *`,
    [userId]
  );
  return serializeRows(result.rows);
};

const clearByUser = async (userId) => {
  const result = await db.query(`DELETE FROM notifications WHERE user_id = $1 RETURNING *`, [userId]);
  return serializeRows(result.rows);
};

module.exports = { create, findByUser, markAsRead, markAllAsRead, clearByUser };
