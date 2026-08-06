const db = require("../configure/wubFashionDB");
const { serializeRow, serializeRows } = require("../services/sqlHelpers");

const buildAssignments = (payload, allowedFields, startIndex = 1) => {
  const keys = Object.keys(payload).filter(
    (key) => allowedFields.includes(key) && payload[key] !== undefined
  );

  const assignments = keys.map((key, index) => `${key} = $${index + startIndex}`);
  const values = keys.map((key) =>
    typeof payload[key] === "object" && payload[key] !== null && !(payload[key] instanceof Date)
      ? JSON.stringify(payload[key])
      : payload[key]
  );

  return { keys, assignments, values };
};

const createSimpleCrudRepository = ({ table, allowedFields }) => ({
  async create(payload) {
    const { keys, values } = buildAssignments(payload, allowedFields);

    const placeholders = keys.map((_, index) => `$${index + 1}`).join(", ");
    const result = await db.query(
      `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`,
      values
    );

    return serializeRow(result.rows[0]);
  },

  async findAll({ orderBy = "created_at DESC" } = {}) {
    const result = await db.query(`SELECT * FROM ${table} ORDER BY ${orderBy}`);
    return serializeRows(result.rows);
  },

  async findById(id) {
    const result = await db.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    return serializeRow(result.rows[0]);
  },

  async findByIds(ids = []) {
    if (!ids.length) {
      return [];
    }

    const result = await db.query(`SELECT * FROM ${table} WHERE id = ANY($1::uuid[])`, [ids]);
    return serializeRows(result.rows);
  },

  async updateById(id, payload) {
    const { assignments, values } = buildAssignments(payload, allowedFields);

    if (!assignments.length) {
      return this.findById(id);
    }

    const result = await db.query(
      `UPDATE ${table} SET ${assignments.join(", ")}, updated_at = NOW() WHERE id = $${
        values.length + 1
      } RETURNING *`,
      [...values, id]
    );

    return serializeRow(result.rows[0]);
  },

  async deleteById(id) {
    const result = await db.query(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [id]);
    return serializeRow(result.rows[0]);
  },
});

module.exports = {
  createSimpleCrudRepository,
};
