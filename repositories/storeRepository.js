const db = require("../configure/wubFashionDB");
const { serializeRow, serializeRows } = require("../services/sqlHelpers");

const create = async ({ store_id, store_name, owner_id, address }) => {
  const result = await db.query(
    `
      INSERT INTO stores (store_id, store_name, owner_id, address)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [store_id, store_name, owner_id, address]
  );
  return serializeRow(result.rows[0]);
};

const updateById = async (id, payload) => {
  const fields = [];
  const values = [];

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined) {
      values.push(value);
      fields.push(`${key} = $${values.length}`);
    }
  });

  const result = await db.query(
    `UPDATE stores SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id]
  );

  return serializeRow(result.rows[0]);
};

const deleteById = async (id) => {
  const result = await db.query(`DELETE FROM stores WHERE id = $1 RETURNING *`, [id]);
  return serializeRow(result.rows[0]);
};

const findById = async (id) => {
  const result = await db.query(`SELECT * FROM stores WHERE id = $1`, [id]);
  return serializeRow(result.rows[0]);
};

const findByOwnerId = async (ownerId) => {
  const result = await db.query(`SELECT * FROM stores WHERE owner_id = $1 ORDER BY created_at DESC`, [
    ownerId,
  ]);
  return serializeRows(result.rows);
};

const findAll = async () => {
  const result = await db.query(`SELECT * FROM stores ORDER BY created_at DESC`);
  return serializeRows(result.rows);
};

module.exports = { create, updateById, deleteById, findById, findByOwnerId, findAll };
