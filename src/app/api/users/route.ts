import { NextResponse } from "next/server";
import { query } from "@/server/db";

export async function POST(request: Request) {
  try {
    // 记录原始请求信息
    console.log(
      "Request headers:",
      Object.fromEntries(request.headers.entries())
    );

    // 获取请求体
    const bodyText = await request.text();
    console.log("Raw request body:", bodyText);

    // 尝试解析JSON
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      console.error("JSON parse error:", e);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    console.log("Parsed request body:", body);

    // 检查字段是否存在
    if (!body) {
      console.log("Body is null or undefined");
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 }
      );
    }

    const { username, email } = body;
    console.log("Extracted values:", { username, email });

    // 检查字段是否为空
    if (!username || !email) {
      console.log("Validation failed - missing fields");
      return NextResponse.json(
        { error: "Username and email are required" },
        { status: 400 }
      );
    }

    // 检查字段是否为空字符串
    if (username.trim() === "" || email.trim() === "") {
      console.log("Validation failed - empty strings");
      return NextResponse.json(
        { error: "Username and email cannot be empty" },
        { status: 400 }
      );
    }

    const result = await query(
      "INSERT INTO users (username, email) VALUES ($1, $2) RETURNING *",
      [username, email]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error("Full error details:", error);
    if (error.code === "23505") {
      // Unique violation
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await query("SELECT * FROM users ORDER BY created_at DESC");
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
