import { cookies } from "next/headers";
import { SessionUser } from "@/lib/types";
import { decodeSession, encodeSession, sessionCookieName } from "@/lib/session-cookie";

type LoginUser = SessionUser & { password: string };

const LOGIN_USERS: LoginUser[] = [
  {
    id: "u-admin",
    name: "本部 管理者",
    email: "hq@example.com",
    password: "pass1234",
    role: "admin",
    storeId: null,
  },
  {
    id: "u-store-1",
    name: "店舗A 担当",
    email: "store-a@example.com",
    password: "pass1234",
    role: "store",
    storeId: "store-a",
  },
  {
    id: "u-store-all",
    name: "全店 閲覧",
    email: "all-store@example.com",
    password: "pass1234",
    role: "store_all",
    storeId: null,
  },
];

export function authenticate(email: string, password: string): SessionUser | null {
  const user = LOGIN_USERS.find((u) => u.email === email && u.password === password);
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    storeId: user.storeId,
  };
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
