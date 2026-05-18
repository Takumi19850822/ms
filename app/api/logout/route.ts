import { NextResponse } from "next/server";
import { accessTokenCookieName, refreshTokenCookieName } from "@/lib/session-cookie";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: accessTokenCookieName,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set({
    name: refreshTokenCookieName,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
