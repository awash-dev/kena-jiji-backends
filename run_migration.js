const db = require("./configure/wubFashionDB");

async function runMigration() {
  console.log("Running SQL migrations...");
  try {
    await db.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture JSONB NOT NULL DEFAULT '[]'::jsonb;
    `);
    console.log("Migrations applied successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

runMigration();
