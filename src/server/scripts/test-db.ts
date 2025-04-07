import { config } from "dotenv";

// Load environment variables from .env file
config();

import { query } from "../db.js";

async function main() {
  try {
    // Test database connection
    console.log("Testing database connection...");
    const result = await query("SELECT * FROM users LIMIT 1");
    console.log("Database connection successful!");
    console.log("Table structure:", result.rows);

    // Check table structure
    const tableInfo = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log("Table columns:", tableInfo.rows);

    process.exit(0);
  } catch (error) {
    console.error("Database test failed:", error);
    process.exit(1);
  }
}

main();
