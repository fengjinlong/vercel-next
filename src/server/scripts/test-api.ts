import { config } from "dotenv";

// Load environment variables from .env file
config();

import { query } from "../db.js";

async function main() {
  try {
    // Test inserting a user
    console.log("Testing user insertion...");
    const testUser = {
      username: "testuser",
      email: "test@example.com",
    };

    const insertResult = await query(
      "INSERT INTO users (username, email) VALUES ($1, $2) RETURNING *",
      [testUser.username, testUser.email]
    );

    console.log("User inserted successfully:", insertResult.rows[0]);

    // Clean up test data
    await query("DELETE FROM users WHERE email = $1", [testUser.email]);
    console.log("Test data cleaned up");

    process.exit(0);
  } catch (error) {
    console.error("API test failed:", error);
    process.exit(1);
  }
}

main();
