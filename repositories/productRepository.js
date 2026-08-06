const db = require("../configure/wubFashionDB");
const { serializeRow, serializeRows } = require("../services/sqlHelpers");

const writableFields = [
  "title",
  "slug",
  "description",
  "price",
  "old_price",
  "category",
  "subcategory",
  "brand",
  "quantity",
  "sold",
  "postedbyuserid",
  "store",
  "images",
  "product_approved",
  "rejection_reason",
  "colors",
  "tags",
  "ratings",
  "totalrating",
  "reviews",
];

const buildAssignments = (payload, startIndex = 1) => {
  const keys = Object.keys(payload).filter(
    (key) => writableFields.includes(key) && payload[key] !== undefined
  );
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
    `INSERT INTO products (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`,
    values
  );

  return serializeRow(result.rows[0]);
};

const findById = async (id) => {
  const result = await db.query(
    `
      SELECT p.*, s.store_name
      FROM products p
      LEFT JOIN stores s ON s.id = p.store
      WHERE p.id = $1
    `,
    [id]
  );

  const product = serializeRow(result.rows[0]);

  if (product && product.storeName) {
    product.store = {
      _id: product.store,
      storeName: product.storeName,
    };
    delete product.storeName;
  }

  return product;
};

const findAll = async ({
  filters = {},
  orderBy = "p.created_at DESC",
  limit,
  offset = 0,
} = {}) => {
  const whereClauses = [];
  const values = [];

  Object.entries(filters).forEach(([key, value]) => {
    values.push(value);
    if (key === "product_approved") {
      whereClauses.push(`LOWER(p.${key}) = LOWER($${values.length})`);
    } else {
      whereClauses.push(`p.${key} = $${values.length}`);
    }
  });

  let sql = `
    SELECT p.*, s.store_name
    FROM products p
    LEFT JOIN stores s ON s.id = p.store
  `;

  if (whereClauses.length) {
    sql += ` WHERE ${whereClauses.join(" AND ")}`;
  }

  sql += ` ORDER BY ${orderBy}`;

  if (limit !== undefined) {
    values.push(Number(limit));
    sql += ` LIMIT $${values.length}`;
  }

  if (offset) {
    values.push(Number(offset));
    sql += ` OFFSET $${values.length}`;
  }

  const result = await db.query(sql, values);

  return serializeRows(result.rows).map((product) => {
    if (product.storeName) {
      product.store = {
        _id: product.store,
        storeName: product.storeName,
      };
      delete product.storeName;
    }

    return product;
  });
};

const count = async (filters = {}) => {
  const whereClauses = [];
  const values = [];

  Object.entries(filters).forEach(([key, value]) => {
    values.push(value);
    if (key === "product_approved") {
      whereClauses.push(`LOWER(${key}) = LOWER($${values.length})`);
    } else {
      whereClauses.push(`${key} = $${values.length}`);
    }
  });

  let sql = `SELECT COUNT(*)::int AS count FROM products`;
  if (whereClauses.length) {
    sql += ` WHERE ${whereClauses.join(" AND ")}`;
  }

  const result = await db.query(sql, values);
  return result.rows[0]?.count || 0;
};

const updateById = async (id, payload) => {
  const { assignments, values } = buildAssignments(payload);

  if (!assignments.length) {
    return findById(id);
  }

  const result = await db.query(
    `UPDATE products SET ${assignments.join(", ")}, updated_at = NOW() WHERE id = $${
      values.length + 1
    } RETURNING *`,
    [...values, id]
  );

  return serializeRow(result.rows[0]);
};

const deleteById = async (id) => {
  const result = await db.query(`DELETE FROM products WHERE id = $1 RETURNING *`, [id]);
  return serializeRow(result.rows[0]);
};

const findByStore = async (storeId) => findAll({ filters: { store: storeId } });

const findByMerchant = async (merchantId, { limit } = {}) =>
  findAll({
    filters: { postedbyuserid: merchantId },
    orderBy: "p.created_at DESC",
    limit,
  });

module.exports = {
  create,
  findById,
  findAll,
  count,
  updateById,
  deleteById,
  findByStore,
  findByMerchant,
};
