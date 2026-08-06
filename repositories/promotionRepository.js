const db = require("../configure/wubFashionDB");
const { serializeRow, serializeRows } = require("../services/sqlHelpers");

const create = async (payload) => {
  const result = await db.query(
    `
      INSERT INTO promotions (code, discount_type, amount, expiration_date, min_order_amount, max_discount_amount, product_ids, active, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
      RETURNING *
    `,
    [
      payload.code,
      payload.discount_type,
      payload.amount,
      payload.expiration_date,
      payload.min_order_amount || 0,
      payload.max_discount_amount || null,
      JSON.stringify(payload.product_ids || []),
      payload.active ?? true,
      payload.created_by,
    ]
  );
  return serializeRow(result.rows[0]);
};

const updateById = async (id, payload) => {
  const fields = [];
  const values = [];
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined) {
      values.push(Array.isArray(value) ? JSON.stringify(value) : value);
      fields.push(`${key} = $${values.length}`);
    }
  });
  const result = await db.query(
    `UPDATE promotions SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id]
  );
  return serializeRow(result.rows[0]);
};

const findById = async (id) => {
  const result = await db.query(`SELECT * FROM promotions WHERE id = $1`, [id]);
  return serializeRow(result.rows[0]);
};

const findAll = async ({ active } = {}) => {
  const sql = active === undefined ? `SELECT * FROM promotions ORDER BY created_at DESC` : `SELECT * FROM promotions WHERE active = $1 ORDER BY created_at DESC`;
  const result = await db.query(sql, active === undefined ? [] : [active]);
  return serializeRows(result.rows);
};

const findByProductId = async (productId) => {
  const result = await db.query(
    `SELECT * FROM promotions WHERE active = TRUE AND product_ids @> $1::jsonb ORDER BY created_at DESC`,
    [JSON.stringify([productId])]
  );
  return serializeRows(result.rows);
};

module.exports = { create, updateById, findById, findAll, findByProductId };
