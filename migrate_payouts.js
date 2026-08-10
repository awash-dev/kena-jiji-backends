require("dotenv").config();
const { Pool } = require("pg");

const connectionString =
  process.env.DATABASE_URL || process.env.Postgres_URL || process.env.POSTGRES_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    console.log("Migration started...");

    // 1. Add is_default column if it doesn't exist
    await client.query(`
      ALTER TABLE merchant_bank_accounts 
      ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE
    `);
    console.log("Added is_default column");

    // 2. Drop the UNIQUE constraint on merchant_id.
    // The constraint is usually named merchant_bank_accounts_merchant_id_key.
    await client.query(`
      ALTER TABLE merchant_bank_accounts 
      DROP CONSTRAINT IF EXISTS merchant_bank_accounts_merchant_id_key
    `);
    console.log("Dropped UNIQUE constraint on merchant_id");

    // 3. Seed an order for merchant@donsa.com
    const merchantRes = await client.query("SELECT id FROM users WHERE email = 'merchant@donsa.com'");
    if (merchantRes.rows.length > 0) {
      const merchantId = merchantRes.rows[0].id;

      // Check if merchant has any products to fake a cart
      const prodRes = await client.query("SELECT id, title, price FROM products WHERE postedbyuserid = $1 LIMIT 1", [merchantId]);
      
      let product = null;
      if (prodRes.rows.length > 0) {
        product = prodRes.rows[0];
      } else {
        // Create a dummy product for them
        const storeRes = await client.query("SELECT id FROM stores WHERE owner_id = $1 LIMIT 1", [merchantId]);
        if (storeRes.rows.length > 0) {
          const storeId = storeRes.rows[0].id;
          const insertProd = await client.query(`
            INSERT INTO products (title, slug, description, price, old_price, category, subcategory, brand, quantity, postedbyuserid, store, product_approved)
            VALUES ('Dummy Test Product', 'dummy-test-prod-' || extract(epoch from now()), 'A dummy product', 2000.0, 2500.0, 'Testing', 'Testing', 'TestBrand', 10, $1, $2, 'approved')
            RETURNING id, title, price
          `, [merchantId, storeId]);
          product = insertProd.rows[0];
        }
      }

      if (product) {
        const dummyCart = JSON.stringify([{
          product: { title: product.title, price: Number(product.price) },
          quantity: 2,
          price: Number(product.price),
          postedbyuserid: merchantId,
        }]);

        await client.query(`
          INSERT INTO orders (user_id, first_name, last_name, email, phone_number, address, city, country, postal_code, cart, total_price, total_price_after_discount, order_status, admin_approval_status)
          VALUES ($1, 'Test', 'Customer', 'test@customer.com', '0900000000', '123 Test St', 'Addis Ababa', 'Ethiopia', 1000, $2, $3, $3, 'confirmed', 'approved')
        `, [merchantId, dummyCart, Number(product.price) * 2]);
        console.log("Inserted dummy approved order for merchant@donsa.com worth " + (Number(product.price) * 2) + " ETB");
      } else {
        console.log("Could not find a store to create a dummy product for the merchant.");
      }
    } else {
      console.log("Could not find merchant@donsa.com");
    }

    await client.query("COMMIT");
    console.log("Migration completed successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
  } finally {
    client.release();
    pool.end();
  }
}

runMigration();
