import { NextResponse } from "next/server";
import { createSessionCookieValue } from "@/lib/auth";
import { sessionCookieName } from "@/lib/session-cookie";
import { authenticateUser } from "@/lib/users";

type LoginRequest = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as LoginRequest;
  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";

  const user = await authenticateUser(email, password);
  if (!user) {
    return NextResponse.json({ message: "invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: sessionCookieName,
    value: createSessionCookieValue(user),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}
