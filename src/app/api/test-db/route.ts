import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    // 测试数据库连接
    const result = await pool.query("SELECT NOW()");
    return NextResponse.json({
      success: true,
      timestamp: result.rows[0].now,
      message: "Database connection successful",
    });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Database connection failed",
        details: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      }
    );
  }
}
