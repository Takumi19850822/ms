import { NextResponse } from "next/server";
import { resolveSessionFromTokens } from "@/lib/auth-session";
import { accessTokenCookieName, refreshTokenCookieName } from "@/lib/session-cookie";
import { getSupabaseAnon } from "@/lib/supabase";

type LoginRequest = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as LoginRequest;
  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";

  const client = getSupabaseAnon();
  const signInResult = await client.auth.signInWithPassword({ email, password });
  if (signInResult.error || !signInResult.data.session) {
    return NextResponse.json({ message: "invalid credentials" }, { status: 401 });
  }

  const session = signInResult.data.session;
  const appSession = await resolveSessionFromTokens({
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
  });
  if (!appSession) {
    return NextResponse.json({ message: "invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: accessTokenCookieName,
    value: session.access_token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: session.expires_in ?? 60 * 60,
  });
  response.cookies.set({
    name: refreshTokenCookieName,
    value: session.refresh_token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return response;
}
