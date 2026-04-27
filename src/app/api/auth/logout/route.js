import { NextResponse } from "next/server";
import { getSessionCookieConfig, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieConfig(),
    maxAge: 0
  });
  return response;
}
