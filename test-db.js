const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    "postgresql://neondb_owner:npg_o3YgnH1UscXm@ep-empty-salad-avsaz4hq-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  connectionTimeoutMillis: 10000,
});

async function test() {
  try {
    console.log("Connecting...");
    const result = await pool.query("SELECT NOW()");
    console.log("DATABASE WORKS:", result.rows);
  } catch (err) {
    console.error("DATABASE FAILED:");
    console.error(err);
  } finally {
    await pool.end();
  }
}

test();