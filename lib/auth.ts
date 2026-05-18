import { cookies } from "next/headers";
import { SessionUser } from "@/lib/types";
import { sessionCookieName } from "@/lib/session-cookie";
import { sealSession, unsealSession } from "@/lib/session-seal";

export async function getSessionFromCookie(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(sessionCookieName)?.value;
  if (!raw) {
    return null;
  }
  return unsealSession(raw);
}

export async function createSessionCookieValue(user: SessionUser): Promise<string> {
  return sealSession(user);
}
