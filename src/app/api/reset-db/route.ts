import { NextResponse } from "next/server";
import { resetDatabase, initDb } from "@/lib/db";

export async function POST() {
  try {
    await resetDatabase();
    await initDb();
    return NextResponse.json({ message: "Database reset successfully" });
  } catch (error) {
    console.error("Failed to reset database:", error);
    return NextResponse.json(
      {
        error: "Failed to reset database",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
