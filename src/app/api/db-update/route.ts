import { NextResponse } from "next/server";
import { addIvColumn } from "@/lib/db";

export async function POST() {
  try {
    await addIvColumn();
    return NextResponse.json({ message: "Database updated successfully" });
  } catch (error) {
    console.error("Failed to update database:", error);
    return NextResponse.json(
      {
        error: "Failed to update database",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
