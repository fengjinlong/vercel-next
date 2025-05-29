import { NextResponse } from "next/server";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// POST /api/indicator/:id - 更新指标记录
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    console.log("Update indicator data:", { id, ...data });

    const {
      optionId,
      time,
      currentPrice,
      iv,
      delta,
      gamma,
      theta,
      vega,
      dvol,
    } = data;

    const query = `
      UPDATE option_indicator 
      SET option_id = $1,
          time = $2,
          current_price = $3,
          iv = $4,
          delta = $5,
          gamma = $6,
          theta = $7,
          vega = $8,
          dvol = $9
      WHERE id = $10
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
        dvol,
        created_at as "createdAt"`;

    const values = [
      optionId,
      time,
      currentPrice,
      iv,
      delta,
      gamma,
      theta,
      vega,
      dvol,
      id,
    ];
    console.log("SQL Query:", query);
    console.log("Query values:", values);

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      console.log("No rows updated");
      return NextResponse.json(
        { error: "Indicator not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error updating indicator:", error);
    // 添加更详细的错误信息
    const errorDetail =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to update indicator", detail: errorDetail },
      { status: 500 }
    );
  }
}

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
