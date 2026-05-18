import { cookies } from "next/headers";
import { SessionUser } from "@/lib/types";
import { resolveSessionFromTokens } from "@/lib/auth-session";
import { accessTokenCookieName, refreshTokenCookieName } from "@/lib/session-cookie";

export async function getSessionFromCookie(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(accessTokenCookieName)?.value ?? null;
  const refreshToken = cookieStore.get(refreshTokenCookieName)?.value ?? null;
  return resolveSessionFromTokens({ accessToken, refreshToken });
}

export async function getAccessTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(accessTokenCookieName)?.value ?? null;
}
