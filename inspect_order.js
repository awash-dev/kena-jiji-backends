const db = require("./configure/wubFashionDB");

async function check() {
  const res = await db.query("SELECT id, tx_ref, cart FROM orders WHERE tx_ref LIKE 'KENA-%' LIMIT 5");
  console.log("KENA ORDERS:");
  console.log(JSON.stringify(res.rows, null, 2));

  // Also check all distinct cart shapes across all orders
  const allOrders = await db.query("SELECT id, tx_ref, cart FROM orders LIMIT 20");
  for (const o of allOrders.rows) {
    console.log(`Order ${o.id} (${o.tx_ref}):`);
    console.log(JSON.stringify(o.cart, null, 2));
  }

  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
