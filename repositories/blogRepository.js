const db = require("../configure/wubFashionDB");
const { serializeRow, serializeRows } = require("../services/sqlHelpers");

const create = async (payload) => {
  const result = await db.query(
    `
      INSERT INTO blogs (title, description, category, subcategory, likes, dislikes, author, postedbyuserid, images, ad_type, is_active, products, merchant_id, store_id)
      VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9::jsonb, $10, $11, $12::jsonb, $13, $14)
      RETURNING *
    `,
    [
      payload.title,
      payload.description,
      payload.category,
      payload.subcategory || "",
      JSON.stringify(payload.likes || []),
      JSON.stringify(payload.dislikes || []),
      payload.author || "Admin",
      payload.postedbyuserid,
      JSON.stringify(payload.images || []),
      payload.ad_type || "home_slider",
      payload.is_active === undefined ? true : payload.is_active,
      JSON.stringify(payload.products || []),
      payload.merchant_id || payload.merchantId || null,
      payload.store_id || payload.storeId || null,
    ]
  );
  return serializeRow(result.rows[0]);
};

const updateById = async (id, payload) => {
  const fields = [];
  const values = [];
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined) {
      values.push(Array.isArray(value) || (value && typeof value === "object") ? JSON.stringify(value) : value);
      fields.push(`${key} = $${values.length}`);
    }
  });
  const result = await db.query(
    `UPDATE blogs SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id]
  );
  return serializeRow(result.rows[0]);
};

const findById = async (id) => {
  const result = await db.query(`SELECT * FROM blogs WHERE id = $1`, [id]);
  return serializeRow(result.rows[0]);
};

const findAll = async () => {
  const result = await db.query(`SELECT * FROM blogs ORDER BY created_at DESC`);
  return serializeRows(result.rows);
};

const deleteById = async (id) => {
  const result = await db.query(`DELETE FROM blogs WHERE id = $1 RETURNING *`, [id]);
  return serializeRow(result.rows[0]);
};

module.exports = { create, updateById, findById, findAll, deleteById };
