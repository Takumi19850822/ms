import type { NextRequest } from "next/server";
import type { SessionUser } from "@/lib/types";
import { resolveSessionFromTokens } from "@/lib/auth-session";

export const accessTokenCookieName = "ms_access_token";
export const refreshTokenCookieName = "ms_refresh_token";

export async function getSessionFromRequest(request: NextRequest): Promise<SessionUser | null> {
  const accessToken = request.cookies.get(accessTokenCookieName)?.value ?? null;
  const refreshToken = request.cookies.get(refreshTokenCookieName)?.value ?? null;
  return resolveSessionFromTokens({ accessToken, refreshToken });
}
