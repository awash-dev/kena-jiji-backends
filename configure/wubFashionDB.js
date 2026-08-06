require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const connectionString =
  process.env.DATABASE_URL || process.env.Postgres_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const pool = new Pool({
  connectionString,
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
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  await pool.query(schemaSql);
  schemaInitialized = true;
};

const connectDB = async () => {
  try {
    await pool.query("SELECT 1");
    await initializeSchema();
    console.log("PostgreSQL connected");
  } catch (error) {
    console.error("PostgreSQL connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
module.exports.pool = pool;
module.exports.query = query;
module.exports.withTransaction = withTransaction;
module.exports.initializeSchema = initializeSchema;
