import { NextResponse } from "next/server";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET /api/indicator - 获取所有指标记录
export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT 
        id,
        option_id as "optionId",
        time,
        current_price as "currentPrice",
        iv,
        delta,
        gamma,
        theta,
        vega,
        created_at as "createdAt"
      FROM option_indicator 
      ORDER BY created_at DESC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching indicators:", error);
    return NextResponse.json(
      { error: "Failed to fetch indicators" },
      { status: 500 }
    );
  }
}

// POST /api/indicator - 创建新的指标记录
export async function POST(request: Request) {
  try {
    const { optionId, time, currentPrice, iv, delta, gamma, theta, vega } =
      await request.json();

    const { rows } = await pool.query(
      `INSERT INTO option_indicator (
        option_id, time, current_price, iv, delta, gamma, theta, vega
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING 
        id,
        option_id as "optionId",
        time,
        current_price as "currentPrice",
        iv,
        delta,
        gamma,
        theta,
        vega,
        created_at as "createdAt"`,
      [optionId, time, currentPrice, iv, delta, gamma, theta, vega]
    );

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error creating indicator:", error);
    return NextResponse.json(
      { error: "Failed to create indicator" },
      { status: 500 }
    );
  }
}

// DELETE /api/indicator/:id - 删除指标记录
export async function DELETE(request: Request) {
  try {
    const id = request.url.split("/").pop();

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
