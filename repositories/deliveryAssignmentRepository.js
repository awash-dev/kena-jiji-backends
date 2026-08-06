const db = require("../configure/wubFashionDB");
const { serializeRow, serializeRows } = require("../services/sqlHelpers");

const create = async ({ order_id, delivery_boy, status }) => {
  const result = await db.query(
    `
      INSERT INTO delivery_assignments (order_id, delivery_boy, status)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [order_id, delivery_boy, status || "pending"]
  );
  return serializeRow(result.rows[0]);
};

const findByDeliveryBoy = async (deliveryBoyId) => {
  const result = await db.query(
    `SELECT * FROM delivery_assignments WHERE delivery_boy = $1 ORDER BY assigned_at DESC`,
    [deliveryBoyId]
  );
  return serializeRows(result.rows);
};

const findById = async (id) => {
  const result = await db.query(`SELECT * FROM delivery_assignments WHERE id = $1`, [id]);
  return serializeRow(result.rows[0]);
};

const updateById = async (id, payload) => {
  const fields = [];
  const values = [];
  Object.entries(payload).forEach(([key, value]) => {
    values.push(value);
    fields.push(`${key} = $${values.length}`);
  });
  const result = await db.query(
    `UPDATE delivery_assignments SET ${fields.join(", ")} WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id]
  );
  return serializeRow(result.rows[0]);
};

module.exports = { create, findByDeliveryBoy, findById, updateById };
