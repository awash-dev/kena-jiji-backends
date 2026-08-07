require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const connectionString =
  process.env.DATABASE_URL || process.env.Postgres_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.warn("DATABASE_URL is not configured in environment variables.");
}

const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: {
    rejectUnauthorized: false,
  },
});

let schemaInitialized = false;

const query = async (text, params = []) => pool.query(text, params);

const withTransaction = async (callback) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const initializeSchema = async () => {
  if (schemaInitialized) {
    return;
  }

  const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    await pool.query(schemaSql);
    schemaInitialized = true;
  }
};

const connectDB = async () => {
  try {
    if (!connectionString) {
      console.error("PostgreSQL connection error: DATABASE_URL is missing.");
      return;
    }
    await pool.query("SELECT 1");
    await initializeSchema();
    console.log("PostgreSQL connected successfully");
  } catch (error) {
    console.error("PostgreSQL connection error:", error.message);
    if (!process.env.VERCEL) {
      // Don't crash process in Vercel environment
      console.warn("Continuing server execution despite DB connection error...");
    }
  }
};

module.exports = connectDB;
module.exports.pool = pool;
module.exports.query = query;
module.exports.withTransaction = withTransaction;
module.exports.initializeSchema = initializeSchema;
