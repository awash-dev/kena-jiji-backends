const db = require("../configure/wubFashionDB");
const { serializeRow, serializeRows } = require("../services/sqlHelpers");

const create = async (payload) => {
  const result = await db.query(
    `
      INSERT INTO reports (user_id, title, description, issue_type, priority, email, created_by_id, role, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
    [
      payload.user_id,
      payload.title,
      payload.description,
      payload.issue_type,
      payload.priority,
      payload.email,
      payload.created_by_id,
      payload.role,
      payload.status || "open",
    ]
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
    `UPDATE reports SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id]
  );
  return serializeRow(result.rows[0]);
};

const findById = async (id) => {
  const result = await db.query(`SELECT * FROM reports WHERE id = $1`, [id]);
  return serializeRow(result.rows[0]);
};

const findAll = async () => {
  const result = await db.query(`SELECT * FROM reports ORDER BY created_at DESC`);
  return serializeRows(result.rows);
};

const deleteById = async (id) => {
  const result = await db.query(`DELETE FROM reports WHERE id = $1 RETURNING *`, [id]);
  return serializeRow(result.rows[0]);
};

module.exports = { create, updateById, findById, findAll, deleteById };
