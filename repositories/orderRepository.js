const db = require("../configure/wubFashionDB");
const { serializeRow, serializeRows } = require("../services/sqlHelpers");

const writableFields = [
  "user_id",
  "first_name",
  "last_name",
  "email",
  "phone_number",
  "address",
  "city",
  "country",
  "other",
  "postal_code",
  "tx_ref",
  "payment_info",
  "cart",
  "paid_at",
  "month",
  "total_price",
  "total_price_after_discount",
  "order_status",
  "assigned_to",
  "callback_url",
  "return_url",
  "currency",
  "payment_method",
  "bank_receipt_url",
  "admin_approval_status",
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

const mapOrder = (row) => {
  const order = serializeRow(row);

  if (!order) {
    return null;
  }

  if (row.user_firstname) {
    order.user = {
      _id: row.user_id,
      id: row.user_id,
      firstname: row.user_firstname,
      lastname: row.user_lastname,
      email: row.user_email,
      mobile: row.user_mobile,
      role: row.user_role,
    };
  } else {
    order.user = order.userId;
  }

  if (row.assigned_firstname) {
    order.assignedTo = {
      _id: row.assigned_to,
      id: row.assigned_to,
      firstname: row.assigned_firstname,
      lastname: row.assigned_lastname,
      email: row.assigned_email,
      phone_number: row.assigned_mobile,
    };
  } else if (order.assignedTo === undefined) {
    order.assignedTo = order.assignedTo || null;
  }

  delete order.userId;

  // Ensure cart is an Array
  if (typeof order.cart === "string") {
    try {
      order.cart = JSON.parse(order.cart);
    } catch (_) {
      order.cart = [];
    }
  }
  if (!Array.isArray(order.cart)) {
    order.cart = [];
  }

  return order;
};

const hydrateOrders = async (orders) => {
  if (!orders || !orders.length) return orders;

  const productIds = new Set();
  for (const order of orders) {
    if (Array.isArray(order.cart)) {
      for (const item of order.cart) {
        if (!item) continue;
        const pId = typeof item.product === "object" && item.product
          ? (item.product._id || item.product.id)
          : (item.product || item.productId || item.product_id);
        if (pId) productIds.add(String(pId));
      }
    }
  }

  if (productIds.size > 0) {
    try {
      const prodList = Array.from(productIds);
      const res = await db.query(
        `SELECT id, title, price, old_price, images, brand, category, slug, description FROM products WHERE id::text = ANY($1)`,
        [prodList]
      );
      const prodMap = {};
      for (const row of res.rows) {
        const p = serializeRow(row);
        prodMap[String(p.id)] = p;
        if (p._id) prodMap[String(p._id)] = p;
      }

      for (const order of orders) {
        if (Array.isArray(order.cart)) {
          for (const item of order.cart) {
            if (!item) continue;
            const pId = typeof item.product === "object" && item.product
              ? String(item.product._id || item.product.id || "")
              : String(item.product || item.productId || item.product_id || "");
            
            const fullProd = prodMap[pId];
            if (fullProd) {
              item.product = fullProd;
              item.title = item.title || fullProd.title;
              item.name = item.name || fullProd.title;
              item.price = item.price || fullProd.price;
              item.image = item.image || (Array.isArray(fullProd.images) && fullProd.images[0] ? (fullProd.images[0].url || fullProd.images[0].secure_url || fullProd.images[0]) : '');
              item.images = fullProd.images || [];
            } else if (typeof item.product !== "object" || !item.product) {
              item.product = { _id: pId, id: pId, title: item.title || item.name || 'Product', price: item.price || 0 };
            }
          }
        }
      }
    } catch (_) {
      // Ignore hydration errors and return orders as is
    }
  }

  return orders;
};

const baseSelect = `
  SELECT
    o.*,
    u.firstname AS user_firstname,
    u.lastname AS user_lastname,
    u.email AS user_email,
    u.mobile AS user_mobile,
    u.role AS user_role,
    du.firstname AS assigned_firstname,
    du.lastname AS assigned_lastname,
    du.email AS assigned_email,
    du.mobile AS assigned_mobile
  FROM orders o
  LEFT JOIN users u ON u.id = o.user_id
  LEFT JOIN users du ON du.id = o.assigned_to
`;

const create = async (payload) => {
  const { keys, values } = buildAssignments(payload);
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(", ");
  const result = await db.query(
    `INSERT INTO orders (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`,
    values
  );

  const mapped = mapOrder(result.rows[0]);
  const hydrated = await hydrateOrders([mapped]);
  return hydrated[0];
};

const findAll = async () => {
  const result = await db.query(`${baseSelect} ORDER BY o.created_at DESC`);
  const orders = result.rows.map(mapOrder);
  return hydrateOrders(orders);
};

const findByUser = async (userId) => {
  const result = await db.query(`${baseSelect} WHERE o.user_id = $1 ORDER BY o.created_at DESC`, [
    userId,
  ]);
  const orders = result.rows.map(mapOrder);
  return hydrateOrders(orders);
};

const findById = async (id) => {
  if (!id) return null;
  const result = await db.query(`${baseSelect} WHERE o.id::text = $1 OR o.tx_ref = $1 LIMIT 1`, [String(id)]);
  if (!result.rows.length) return null;
  const mapped = mapOrder(result.rows[0]);
  const hydrated = await hydrateOrders([mapped]);
  return hydrated[0];
};

const updateById = async (id, payload) => {
  const { assignments, values } = buildAssignments(payload);

  if (!assignments.length) {
    return findById(id);
  }

  await db.query(
    `UPDATE orders SET ${assignments.join(", ")}, updated_at = NOW() WHERE id = $${values.length + 1}`,
    [...values, id]
  );

  return findById(id);
};

const monthlyIncome = async () => {
  const result = await db.query(
    `
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Month YYYY') AS month,
        COALESCE(SUM(total_price_after_discount), 0)::float AS amount,
        COUNT(*)::int AS count
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `
  );

  return result.rows;
};

const yearlyTotals = async () => {
  const result = await db.query(
    `
      SELECT
        COALESCE(SUM(total_price_after_discount), 0)::float AS amount,
        COUNT(*)::int AS count
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '12 months'
    `
  );

  return result.rows;
};

module.exports = {
  create,
  findAll,
  findByUser,
  findById,
  updateById,
  monthlyIncome,
  yearlyTotals,
};
