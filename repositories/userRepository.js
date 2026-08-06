const db = require("../configure/wubFashionDB");
const { serializeRow, serializeRows } = require("../services/sqlHelpers");

const writableFields = [
  "is_email_verified",
  "firstname",
  "lastname",
  "username",
  "email",
  "mobile",
  "is_active",
  "password",
  "role",
  "is_blocked",
  "address",
  "wishlist",
  "profile_picture",
  "email_verification_otp",
  "email_verification_expires",
  "password_reset_otp",
  "password_reset_expires",
  "refresh_token",
  "password_changed_at",
  "password_reset_token",
  "google_id",
  "facebook_id",
  "provider",
];

const buildAssignments = (payload, startIndex = 1) => {
  const keys = Object.keys(payload).filter((key) => writableFields.includes(key));
  const assignments = keys.map((key, index) => `${key} = $${index + startIndex}`);
  const values = keys.map((key) =>
    Array.isArray(payload[key]) || (payload[key] && typeof payload[key] === "object")
      ? JSON.stringify(payload[key])
      : payload[key]
  );

  return { keys, assignments, values };
};

const create = async (payload) => {
  const { keys, values } = buildAssignments(payload);
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(", ");
  const result = await db.query(
    `INSERT INTO users (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`,
    values
  );

  return serializeRow(result.rows[0]);
};

const findById = async (id) => {
  const result = await db.query(`SELECT * FROM users WHERE id = $1`, [id]);
  return serializeRow(result.rows[0]);
};

const findAll = async () => {
  const result = await db.query(`SELECT * FROM users ORDER BY created_at DESC`);
  return serializeRows(result.rows);
};

const findOneByEmail = async (email) => {
  const result = await db.query(`SELECT * FROM users WHERE LOWER(email) = LOWER($1)`, [email]);
  return serializeRow(result.rows[0]);
};

const findOneByRefreshToken = async (refreshToken) => {
  const result = await db.query(`SELECT * FROM users WHERE refresh_token = $1`, [refreshToken]);
  return serializeRow(result.rows[0]);
};

const findOneByProvider = async (field, value) => {
  const safeField = field === "google_id" || field === "facebook_id" ? field : null;

  if (!safeField) {
    return null;
  }

  const result = await db.query(`SELECT * FROM users WHERE ${safeField} = $1`, [value]);
  return serializeRow(result.rows[0]);
};

const updateById = async (id, payload) => {
  const { assignments, values } = buildAssignments(payload);

  if (!assignments.length) {
    return findById(id);
  }

  const result = await db.query(
    `UPDATE users SET ${assignments.join(", ")}, updated_at = NOW() WHERE id = $${
      values.length + 1
    } RETURNING *`,
    [...values, id]
  );

  return serializeRow(result.rows[0]);
};

const deleteById = async (id) => {
  const result = await db.query(`DELETE FROM users WHERE id = $1 RETURNING *`, [id]);
  return serializeRow(result.rows[0]);
};

const findByRole = async (role) => {
  const result = await db.query(`SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC`, [
    role,
  ]);
  return serializeRows(result.rows);
};

const countByRole = async () => {
  const result = await db.query(
    `SELECT role, COUNT(*)::int AS count FROM users GROUP BY role ORDER BY role ASC`
  );
  return result.rows;
};

module.exports = {
  create,
  findById,
  findAll,
  findOneByEmail,
  findOneByRefreshToken,
  findOneByProvider,
  updateById,
  deleteById,
  findByRole,
  countByRole,
};
