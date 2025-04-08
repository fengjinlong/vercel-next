import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  // 清除token cookie
  cookies().delete("token");

  return NextResponse.json({
    success: true,
    message: "已退出登录",
  });
}
