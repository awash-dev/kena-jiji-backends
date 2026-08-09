const db = require("./configure/wubFashionDB");

async function runMigration() {
  console.log("Running SQL migrations...");
  try {
    await db.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture JSONB NOT NULL DEFAULT '[]'::jsonb;
      
      CREATE TABLE IF NOT EXISTS payment_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cod_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        bank_transfer_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        chapa_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        bank_name TEXT NOT NULL DEFAULT 'CBE (Commercial Bank of Ethiopia)',
        bank_account_name TEXT NOT NULL DEFAULT 'Ethio-Merkato E-Commerce',
        bank_account_number TEXT NOT NULL DEFAULT '1000123456789',
        bank_instructions TEXT NOT NULL DEFAULT 'Transfer exact order amount to the bank account above and upload receipt photo.',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS merchant_bank_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        bank_name TEXT NOT NULL,
        account_number TEXT NOT NULL,
        account_holder_name TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS merchant_withdrawals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount NUMERIC(12, 2) NOT NULL,
        bank_name TEXT NOT NULL,
        account_number TEXT NOT NULL,
        account_holder_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        rejection_reason TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'chapa';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS bank_receipt_url TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_approval_status TEXT NOT NULL DEFAULT 'approved';
      ALTER TABLE blogs ADD COLUMN IF NOT EXISTS is_popup BOOLEAN NOT NULL DEFAULT FALSE;
    `);
    console.log("Migrations applied successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

runMigration();
