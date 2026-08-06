const db = require("../configure/wubFashionDB");
const { serializeRow, serializeRows } = require("../services/sqlHelpers");

const mapCartRow = (row) => {
  const item = serializeRow(row);

  if (row.product_title) {
    item.productId = {
      _id: row.product_id,
      title: row.product_title,
      slug: row.product_slug,
      price: Number(row.product_price),
      description: row.product_description,
      quantity: row.product_quantity,
    };
  }

  return item;
};

const cartSelect = `
  SELECT
    c.*,
    p.title AS product_title,
    p.slug AS product_slug,
    p.price AS product_price,
    p.description AS product_description,
    p.quantity AS product_quantity
  FROM carts c
  LEFT JOIN products p ON p.id = c.product_id
`;

const findByUser = async (userId) => {
  const result = await db.query(`${cartSelect} WHERE c.user_id = $1 ORDER BY c.created_at DESC`, [
    userId,
  ]);
  return result.rows.map(mapCartRow);
};

const findOne = async ({ userId, productId, selectedColor, selectedSize }) => {
  const result = await db.query(
    `
      SELECT *
      FROM carts
      WHERE user_id = $1
        AND product_id = $2
        AND COALESCE(selected_color, '') = COALESCE($3, '')
        AND COALESCE(selected_size, '') = COALESCE($4, '')
      LIMIT 1
    `,
    [userId, productId, selectedColor || null, selectedSize || null]
  );

  return serializeRow(result.rows[0]);
};

const create = async (payload) => {
  const result = await db.query(
    `
      INSERT INTO carts (user_id, product_id, quantity, selected_color, selected_size, color, price)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
    [
      payload.user_id,
      payload.product_id,
      payload.quantity || 1,
      payload.selected_color || null,
      payload.selected_size || null,
      payload.color || null,
      payload.price || null,
    ]
  );

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
    `UPDATE carts SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id]
  );

  return serializeRow(result.rows[0]);
};

const deleteByUserAndProduct = async (userId, productId) => {
  const result = await db.query(
    `DELETE FROM carts WHERE user_id = $1 AND product_id = $2 RETURNING *`,
    [userId, productId]
  );
  return serializeRow(result.rows[0]);
};

const deleteByUserAndCartId = async (userId, cartId) => {
  const result = await db.query(
    `DELETE FROM carts WHERE user_id = $1 AND id = $2 RETURNING *`,
    [userId, cartId]
  );
  return serializeRow(result.rows[0]);
};

const deleteManyByUser = async (userId) => {
  const result = await db.query(`DELETE FROM carts WHERE user_id = $1 RETURNING *`, [userId]);
  return serializeRows(result.rows);
};

const sumQuantityByUser = async (userId) => {
  const result = await db.query(
    `SELECT COALESCE(SUM(quantity), 0)::int AS total_quantity FROM carts WHERE user_id = $1`,
    [userId]
  );

  return result.rows[0]?.total_quantity || 0;
};

const findByIdAndUser = async (userId, cartId) => {
  const result = await db.query(`SELECT * FROM carts WHERE user_id = $1 AND id = $2`, [
    userId,
    cartId,
  ]);
  return serializeRow(result.rows[0]);
};

module.exports = {
  findByUser,
  findOne,
  create,
  updateById,
  deleteByUserAndProduct,
  deleteByUserAndCartId,
  deleteManyByUser,
  sumQuantityByUser,
  findByIdAndUser,
};
