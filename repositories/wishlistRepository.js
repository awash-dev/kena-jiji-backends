const db = require("../configure/wubFashionDB");
const { serializeRow } = require("../services/sqlHelpers");

const add = async (userId, productId) => {
  const result = await db.query(
    `
      INSERT INTO wishlists (user_id, product_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, product_id) DO NOTHING
      RETURNING *
    `,
    [userId, productId]
  );

  return serializeRow(result.rows[0]);
};

const remove = async (userId, productId) => {
  const result = await db.query(
    `DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2 RETURNING *`,
    [userId, productId]
  );

  return serializeRow(result.rows[0]);
};

const findProductsByUser = async (userId) => {
  const result = await db.query(
    `
      SELECT p.*
      FROM wishlists w
      INNER JOIN products p ON p.id = w.product_id
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC
    `,
    [userId]
  );

  return result.rows.map((row) => ({
    ...row,
    _id: row.id,
  }));
};

const countByUser = async (userId) => {
  const result = await db.query(`SELECT COUNT(*)::int AS total FROM wishlists WHERE user_id = $1`, [
    userId,
  ]);
  return result.rows[0]?.total || 0;
};

module.exports = {
  add,
  remove,
  findProductsByUser,
  countByUser,
};
