import { initDb, testConnection } from "../lib/db.js";

async function main() {
  try {
    console.log("Testing database connection...");
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error(
        "Failed to connect to database. Please check your DATABASE_URL environment variable."
      );
      process.exit(1);
    }

    console.log("Initializing database...");
    await initDb();
    console.log("Database initialized successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
}

main();
