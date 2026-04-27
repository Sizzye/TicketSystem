import { NextResponse } from "next/server";
import { readSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"];

function isPublicPath(pathname) {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/vendor") ||
    pathname === "/favicon.ico"
  );
}

export async function middleware(request) {
  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname)) {
    if (pathname === "/login") {
      const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
      const session = await readSessionToken(token);

      if (session) {
        return NextResponse.redirect(new URL("/tickets", request.url));
      }
    }

    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await readSessionToken(token);

  if (session) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search || ""}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"]
};
