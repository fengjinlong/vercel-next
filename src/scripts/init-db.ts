import { initDb } from "../lib/db.js";

async function main() {
  try {
    await initDb();
    console.log("Database tables created successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
}

main();
