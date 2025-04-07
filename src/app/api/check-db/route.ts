import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    // 检查表结构
    const tableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'targets'
    `);

    return NextResponse.json({
      columns: tableInfo.rows,
    });
  } catch (error) {
    console.error("Error checking database structure:", error);
    return NextResponse.json(
      {
        error: "Failed to check database structure",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
