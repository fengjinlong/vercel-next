import { NextResponse } from "next/server";
import { updateDecimalPrecision } from "@/lib/db";

export async function POST() {
  try {
    await updateDecimalPrecision();
    return NextResponse.json({
      message: "Successfully updated decimal precision",
    });
  } catch (error) {
    console.error("Error in update-precision API:", error);
    return NextResponse.json(
      { error: "Failed to update decimal precision" },
      { status: 500 }
    );
  }
}
