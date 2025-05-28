import { NextResponse } from "next/server";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// PUT /api/option/:id - 更新期权标的
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { name, strategy } = await request.json();
    const id = params.id;

    const { rows } = await pool.query(
      `UPDATE option_target 
       SET name = $1, strategy = $2
       WHERE id = $3
       RETURNING *`,
      [name, JSON.stringify(strategy), id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Option not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error updating option:", error);
    return NextResponse.json(
      { error: "Failed to update option" },
      { status: 500 }
    );
  }
}

// DELETE /api/option/:id - 删除期权标的
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // 首先删除关联的指标记录
    await pool.query(
      `DELETE FROM option_indicator 
       WHERE option_id = $1`,
      [id]
    );

    // 然后删除标的
    const { rows } = await pool.query(
      `DELETE FROM option_target 
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Option not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error deleting option:", error);
    return NextResponse.json(
      { error: "Failed to delete option" },
      { status: 500 }
    );
  }
}
