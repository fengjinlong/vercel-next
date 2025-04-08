import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // 硬编码验证: 只允许 admin/111111 登录
    if (username === "admin" && password === "111111") {
      // 生成简单的token (在实际应用中应该使用更安全的方法)
      const token = Buffer.from(`${username}-${Date.now()}`).toString("base64");

      // 返回登录成功响应
      return NextResponse.json({
        success: true,
        message: "登录成功",
        token,
      });
    } else {
      // 返回登录失败响应
      return NextResponse.json(
        {
          success: false,
          message: "用户名或密码错误",
        },
        { status: 401 }
      );
    }
  } catch (error) {
    // 处理异常
    return NextResponse.json(
      {
        success: false,
        message: "服务器错误",
      },
      { status: 500 }
    );
  }
}
