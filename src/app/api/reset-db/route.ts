import { NextResponse } from "next/server";
import { initDb } from "../../../lib/db";

export async function POST() {
  try {
    await initDb();
    return NextResponse.json({ message: "Database reset successfully" });
  } catch (error) {
    console.error("Error resetting database:", error);
    return NextResponse.json(
      {
        error: "Failed to reset database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
