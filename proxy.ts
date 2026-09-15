import { NextRequest, NextResponse } from "next/server";
import { readSession, SESSION_COOKIE } from "./lib/auth";

function loginUrl(request: NextRequest, path: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("next", path);
  return url;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);

  const needsUser =
    pathname.startsWith("/form") || pathname.startsWith("/api/form");
  const needsAdmin =
    (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) &&
    pathname !== "/admin/login";

  if (needsUser && !session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "لطفاً وارد حساب شوید." }, { status: 401 });
    }
    return NextResponse.redirect(loginUrl(request, pathname));
  }

  if (needsAdmin) {
    if (!session) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 401 });
      }
      return NextResponse.redirect(loginUrl(request, pathname));
    }
    if (session.role !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "فقط مدیر فروشگاه دسترسی دارد." }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/form", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/form/:path*", "/admin/:path*", "/api/form/:path*", "/api/admin/:path*"],
};
