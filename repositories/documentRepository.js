const db = require("../configure/wubFashionDB");
const { serializeRow, serializeRows } = require("../services/sqlHelpers");

const create = async (payload) => {
  const result = await db.query(
    `
      INSERT INTO documents (tin_number, images, id_card_images, status, postedbyuserid)
      VALUES ($1, $2::jsonb, $3::jsonb, $4, $5)
      RETURNING *
    `,
    [
      payload.tin_number,
      JSON.stringify(payload.images || []),
      JSON.stringify(payload.id_card_images || []),
      payload.status || "pending",
      payload.postedbyuserid,
    ]
  );
  return serializeRow(result.rows[0]);
};

const findPending = async () => {
  const result = await db.query(`SELECT * FROM documents WHERE status = 'pending' ORDER BY created_at DESC`);
  return serializeRows(result.rows);
};

const updateById = async (id, payload) => {
  const fields = [];
  const values = [];
  Object.entries(payload).forEach(([key, value]) => {
    values.push(Array.isArray(value) ? JSON.stringify(value) : value);
    fields.push(`${key} = $${values.length}`);
  });
  const result = await db.query(
    `UPDATE documents SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id]
  );
  return serializeRow(result.rows[0]);
};

module.exports = { create, findPending, updateById };
