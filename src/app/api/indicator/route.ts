import { NextResponse } from "next/server";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 检查并添加 dvol 列
async function ensureDvolColumn() {
  try {
    await pool.query(`
      ALTER TABLE option_indicator 
      ADD COLUMN IF NOT EXISTS dvol TEXT
    `);
    console.log("Checked/added dvol column successfully");
  } catch (error) {
    console.error("Error checking/adding dvol column:", error);
  }
}

// 检查并添加新列
async function ensureNewColumns() {
  try {
    // First rename the existing delta column to call_delta
    await pool.query(`
      DO $$ 
      BEGIN 
        IF EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'option_indicator' 
          AND column_name = 'delta'
        ) THEN
          ALTER TABLE option_indicator 
          RENAME COLUMN delta TO call_delta;
        END IF;
      END $$;
    `);

    // Then add the new columns if they don't exist
    await pool.query(`
      ALTER TABLE option_indicator 
      ADD COLUMN IF NOT EXISTS put_delta TEXT,
      ADD COLUMN IF NOT EXISTS key_leg_oi TEXT
    `);
    console.log("Checked/added new columns successfully");
  } catch (error) {
    console.error("Error checking/adding new columns:", error);
  }
}

// GET /api/indicator - 获取所有指标记录
export async function GET() {
  try {
    // 确保所有列存在
    await ensureDvolColumn();
    await ensureNewColumns();

    const query = `
      SELECT 
        id,
        option_id as "optionId",
        time,
        current_price as "currentPrice",
        iv,
        call_delta as "callDelta",
        put_delta as "putDelta",
        key_leg_oi as "keyLegOI",
        gamma,
        theta,
        vega,
        dvol,
        created_at as "createdAt"
      FROM option_indicator 
      ORDER BY created_at DESC
    `;

    const { rows } = await pool.query(query);

    return NextResponse.json(rows);
  } catch (error) {
    const errorDetail =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch indicators", detail: errorDetail },
      { status: 500 }
    );
  }
}

// POST /api/indicator - 创建新的指标记录
export async function POST(request: Request) {
  try {
    // 确保 dvol 列存在
    await ensureDvolColumn();

    const data = await request.json();
    console.log("Creating indicator with data:", data);

    const {
      optionId,
      time,
      currentPrice,
      iv,
      callDelta,
      putDelta,
      keyLegOI,
      gamma,
      theta,
      vega,
      dvol,
    } = data;

    const query = `
      INSERT INTO option_indicator (
        option_id, time, current_price, iv, call_delta, put_delta, key_leg_oi, gamma, theta, vega, dvol
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING 
        id,
        option_id as "optionId",
        time,
        current_price as "currentPrice",
        iv,
        call_delta as "callDelta",
        put_delta as "putDelta",
        key_leg_oi as "keyLegOI",
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
      callDelta,
      putDelta,
      keyLegOI,
      gamma,
      theta,
      vega,
      dvol,
    ];
    console.log("Insert query:", query);
    console.log("Insert values:", values);

    const { rows } = await pool.query(query, values);
    console.log("Insert result:", rows[0]);

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error creating indicator:", error);
    const errorDetail =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create indicator", detail: errorDetail },
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
