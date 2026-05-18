import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth";
import { createUser, listUsers } from "@/lib/users";
import { Role } from "@/lib/types";

type CreateUserRequest = {
  name?: string;
  email?: string;
  role?: Role;
  storeId?: string | null;
  isActive?: boolean;
  password?: string;
};

function forbidden() {
  return NextResponse.json({ message: "権限がありません。" }, { status: 403 });
}

export async function GET(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ message: "unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return forbidden();
  }

  const search = new URL(request.url).searchParams.get("search") ?? "";
  const rows = await listUsers(search, session);
  return NextResponse.json({ rows });
}

export async function POST(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ message: "unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return forbidden();
  }

  const body = (await request.json().catch(() => ({}))) as CreateUserRequest;
  try {
    const user = await createUser(session, body);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ユーザ招待に失敗しました。";
    const status = message.includes("required") ? 400 : 500;
    return NextResponse.json({ message }, { status });
  }
}
