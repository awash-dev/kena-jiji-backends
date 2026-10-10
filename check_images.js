const db = require("./configure/wubFashionDB");

async function check() {
  const res = await db.query("SELECT id, title, images FROM products LIMIT 20");
  for (const p of res.rows) {
    console.log(`Product: "${p.title}" | images type: ${typeof p.images} | value:`, JSON.stringify(p.images));
  }
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
