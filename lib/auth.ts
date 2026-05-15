import { cookies } from "next/headers";
import { SessionUser } from "@/lib/types";
import { decodeSession, encodeSession, sessionCookieName } from "@/lib/session-cookie";

export async function getSessionFromCookie(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(sessionCookieName)?.value;
  if (!raw) {
    return null;
  }
  return decodeSession(raw);
}

export function createSessionCookieValue(user: SessionUser): string {
  return encodeSession(user);
}
