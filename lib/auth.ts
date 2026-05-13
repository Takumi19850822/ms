import { cookies } from "next/headers";
import { SessionUser } from "@/lib/types";
import { decodeSession, encodeSession, sessionCookieName } from "@/lib/session-cookie";
import { authenticateUser } from "@/lib/users";

export async function authenticate(email: string, password: string): Promise<SessionUser | null> {
  return authenticateUser(email, password);
}

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
