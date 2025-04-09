import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

// GET /api/targets
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");
  const search = searchParams.get("search") || "";
  const orderBy = searchParams.get("orderBy") || "id";
  const order = searchParams.get("order") || "desc";

  const offset = (page - 1) * pageSize;

  try {
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM targets WHERE name ILIKE $1",
      [`%${search}%`]
    );

    const result = await pool.query(
      `SELECT * FROM targets 
       WHERE name ILIKE $1 
       ORDER BY ${orderBy} ${order}
       LIMIT $2 OFFSET $3`,
      [`%${search}%`, pageSize, offset]
    );

    return NextResponse.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Error fetching targets:", error);
    return NextResponse.json(
      { error: "Failed to fetch targets" },
      { status: 500 }
    );
  }
}

// POST /api/targets
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Received request body:", body);

    const { name } = body;

    if (!name || name.length > 50) {
      console.log("Invalid name:", name);
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }

    console.log("Attempting to insert target with name:", name);
    const result = await pool.query(
      "INSERT INTO targets (name) VALUES ($1) RETURNING *",
      [name]
    );

    console.log("Insert result:", result.rows[0]);
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error creating target:", error);
    // 返回更详细的错误信息
    return NextResponse.json(
      {
        error: "Failed to create target",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE /api/targets
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Target ID is required" },
        { status: 400 }
      );
    }

    await pool.query("DELETE FROM targets WHERE id = $1", [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting target:", error);
    return NextResponse.json(
      { error: "Failed to delete target" },
      { status: 500 }
    );
  }
}

// PATCH /api/targets - Update target name
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Target ID is required" },
        { status: 400 }
      );
    }

    if (!name || name.length > 50) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }

    const result = await pool.query(
      "UPDATE targets SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [name, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating target:", error);
    return NextResponse.json(
      {
        error: "Failed to update target",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
