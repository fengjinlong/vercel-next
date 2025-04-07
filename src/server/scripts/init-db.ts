import { config } from "dotenv";

// Load environment variables from .env file
config();

import { initializeDatabase } from "../db.js";

console.log("Environment variables loaded:", {
  DATABASE_URL: process.env.DATABASE_URL,
});

async function main() {
  try {
    await initializeDatabase();
    console.log("Database initialization completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  }
}

main();
