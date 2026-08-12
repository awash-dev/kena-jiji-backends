const db = require("./configure/wubFashionDB");

async function check() {
  const res = await db.query("SELECT id, title, price, category, product_approved FROM products");
  console.log("Total Products in DB:", res.rows.length);
  console.log("Products:", JSON.stringify(res.rows, null, 2));
  process.exit(0);
}

check().catch((err) => {
  console.error(err);
  process.exit(1);
});
