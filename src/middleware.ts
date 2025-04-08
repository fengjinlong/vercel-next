import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 需要跳过登录检查的路径
const PUBLIC_PATHS = ["/login", "/api/login"];

// 检查路径是否在公开路径列表中
function isPublicPath(path: string) {
  return PUBLIC_PATHS.some(
    (publicPath) => path === publicPath || path.startsWith(`${publicPath}/`)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 如果路径是API路由或静态资源，跳过检查
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".") ||
    isPublicPath(pathname)
  ) {
    return NextResponse.next();
  }

  // 获取token
  const token = request.cookies.get("token")?.value;

  // 如果没有token，重定向到登录页面
  if (!token) {
    const loginUrl = new URL("/login", request.url);

    // 保存当前URL作为重定向目标
    loginUrl.searchParams.set("redirect", pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// 配置匹配的路径
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
