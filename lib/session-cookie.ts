import { NextRequest } from "next/server";
import { SessionUser } from "@/lib/types";

export const sessionCookieName = "ms_session";

export function encodeSession(user: SessionUser): string {
  return encodeURIComponent(JSON.stringify(user));
}

export function decodeSession(value: string): SessionUser | null {
  try {
    const json = decodeURIComponent(value);
    return JSON.parse(json) as SessionUser;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: NextRequest): SessionUser | null {
  const raw = request.cookies.get(sessionCookieName)?.value;
  if (!raw) {
    return null;
  }
  return decodeSession(raw);
}
