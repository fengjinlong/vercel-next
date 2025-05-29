import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

// 添加一个简单的健康检查函数
async function checkDatabaseConnection() {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query("SELECT NOW() as time");
    return {
      connected: true,
      time: result.rows[0].time,
      poolStatus: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      },
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : String(error),
      poolStatus: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      },
    };
  } finally {
    if (client) client.release();
  }
}

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
    // 检查数据库连接
    const connectionStatus = await checkDatabaseConnection();
    if (!connectionStatus.connected) {
      console.error("Database connection failed:", connectionStatus.error);
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: connectionStatus.error,
          poolStatus: connectionStatus.poolStatus,
          env: {
            NODE_ENV: process.env.NODE_ENV,
            DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
            DATABASE_URL_START: process.env.DATABASE_URL
              ? `${process.env.DATABASE_URL.substring(0, 20)}...`
              : null,
          },
        },
        { status: 500 }
      );
    }

    // 检查表是否存在
    const client = await pool.connect();
    try {
      const tableCheck = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'targets')"
      );

      if (!tableCheck.rows[0].exists) {
        console.error("Targets table does not exist");

        // 尝试创建表
        try {
          await client.query(`
            CREATE TABLE IF NOT EXISTS targets (
              id SERIAL PRIMARY KEY,
              name VARCHAR(50) NOT NULL,
              total_assets DECIMAL(15,2) DEFAULT 0,
              total_buy_amount DECIMAL(15,2) DEFAULT 0,
              total_sell_amount DECIMAL(15,2) DEFAULT 0,
              profit_loss DECIMAL(15,2) DEFAULT 0,
              profit_loss_ratio DECIMAL(5,2) DEFAULT 0,
              average_cost DECIMAL(15,2) DEFAULT 0,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // 创建事务表
          await client.query(`
            CREATE TABLE IF NOT EXISTS transactions (
              id SERIAL PRIMARY KEY,
              target_id INTEGER REFERENCES targets(id) ON DELETE CASCADE,
              type VARCHAR(4) NOT NULL CHECK (type IN ('buy', 'sell')),
              quantity DECIMAL(15,2) NOT NULL,
              price DECIMAL(15,2) NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // console.log("Successfully created transactions table");

          // 表已创建，但没有数据，返回空结果
          return NextResponse.json({
            data: [],
            total: 0,
            page,
            pageSize,
            note: "Tables were created automatically as they did not exist",
          });
        } catch (createError) {
          return NextResponse.json(
            {
              error: "Failed to create tables",
              details:
                createError instanceof Error
                  ? createError.message
                  : String(createError),
            },
            { status: 500 }
          );
        }
      }

      // 执行正常查询
      const countResult = await client.query(
        "SELECT COUNT(*) FROM targets WHERE name ILIKE $1",
        [`%${search}%`]
      );

      const result = await client.query(
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
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching targets:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch targets",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
        env: {
          NODE_ENV: process.env.NODE_ENV,
          DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
          DATABASE_URL_START: process.env.DATABASE_URL
            ? `${process.env.DATABASE_URL.substring(0, 20)}...`
            : null,
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/targets
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // console.log("Received request body:", body);

    const { name } = body;

    if (!name || name.length > 50) {
      // console.log("Invalid name:", name);
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }

    const result = await pool.query(
      "INSERT INTO targets (name) VALUES ($1) RETURNING *",
      [name]
    );

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

    // Get the admin password from request body
    const body = await request.json();
    const { adminPassword } = body;

    if (!adminPassword) {
      return NextResponse.json(
        { error: "Admin password is required" },
        { status: 400 }
      );
    }

    // Check if admin password is correct (replace this with your actual admin password)
    const ADMIN_PASSWORD = "fjl198743"; // In production, this should be in environment variables
    if (adminPassword !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "无删除权限" }, { status: 401 });
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
