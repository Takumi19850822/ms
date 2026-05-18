import type { NextRequest } from "next/server";
import type { SessionUser } from "@/lib/types";
import { unsealSession } from "@/lib/session-seal";

export const sessionCookieName = "ms_session";

export async function getSessionFromRequest(request: NextRequest): Promise<SessionUser | null> {
  const raw = request.cookies.get(sessionCookieName)?.value;
  if (!raw) {
    return null;
  }
  return unsealSession(raw);
}
