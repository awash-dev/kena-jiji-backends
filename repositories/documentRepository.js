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

const firstImageUrl = (images) => {
  if (!Array.isArray(images) || images.length === 0) return "";
  const first = images[0];
  if (first && typeof first === "object") {
    return first.secure_url || first.url || first.image || "";
  }
  return String(first);
};

const findMerchantApplications = async () => {
  const result = await db.query(`
    SELECT
      d.*,
      u.firstname AS user_firstname,
      u.lastname AS user_lastname,
      u.username AS user_username,
      u.email AS user_email,
      u.mobile AS user_mobile,
      u.address AS user_address,
      u.is_active AS user_is_active
    FROM documents d
    JOIN users u ON u.id = d.postedbyuserid
    ORDER BY d.created_at DESC
  `);
  return result.rows.map((row) => {
    const doc = serializeRow(row);
    doc.userId = row.postedbyuserid;
    doc.storeName =
      row.user_username ||
      `${row.user_firstname || ""} ${row.user_lastname || ""}`.trim() ||
      "Merchant Store";
    doc.phone = row.user_mobile || "";
    doc.email = row.user_email || "";
    doc.city = row.user_address || "";
    doc.documentUrl = firstImageUrl(doc.images);
    return doc;
  });
};

const updateStatusByUserId = async (userId, status) => {
  const result = await db.query(
    `UPDATE documents SET status = $1, updated_at = NOW() WHERE postedbyuserid = $2 RETURNING *`,
    [status, userId]
  );
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

module.exports = { create, findPending, findMerchantApplications, updateById, updateStatusByUserId };
