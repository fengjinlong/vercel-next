import { NextResponse } from "next/server";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// DELETE /api/indicator/:id - 删除指标记录
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const { rows } = await pool.query(
      `DELETE FROM option_indicator 
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Indicator not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error deleting indicator:", error);
    return NextResponse.json(
      { error: "Failed to delete indicator" },
      { status: 500 }
    );
  }
}
