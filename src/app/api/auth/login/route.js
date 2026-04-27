import { NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionCookieConfig,
  SESSION_COOKIE_NAME,
  validateCredentials
} from "@/lib/auth";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const username = body?.username || "";
  const password = body?.password || "";

  const user = validateCredentials(username, password);

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        message: "Incorrect username or password."
      },
      { status: 401 }
    );
  }

  const sessionToken = await createSessionToken(user);
  const response = NextResponse.json({
    ok: true,
    user: {
      username: user.username,
      displayName: user.displayName,
      role: user.role
    }
  });

  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, getSessionCookieConfig());
  return response;
}
