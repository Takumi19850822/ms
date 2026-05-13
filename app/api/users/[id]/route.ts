import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth";
import { Role } from "@/lib/types";
import { updateUser } from "@/lib/users";

type Params = {
  params: Promise<{ id: string }>;
};

type UpdateUserRequest = {
  name?: string;
  email?: string;
  role?: Role;
  storeId?: string | null;
  isActive?: boolean;
  version?: number;
  password?: string;
};

function forbidden() {
  return NextResponse.json({ message: "権限がありません。" }, { status: 403 });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ message: "unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return forbidden();
  }

  const { id } = await params;
  const body = (await request.json()) as UpdateUserRequest;
  if (!body.name || !body.email || !body.role || body.version === undefined) {
    return NextResponse.json({ message: "入力値が不足しています。" }, { status: 400 });
  }

  const result = await updateUser(id, {
    name: body.name,
    email: body.email,
    role: body.role,
    storeId: body.storeId ?? null,
    isActive: body.isActive ?? true,
    version: body.version,
    password: body.password?.trim() || undefined,
  });

  if (!result.ok) {
    if (result.reason === "version_conflict") {
      return NextResponse.json({ message: "他ユーザに更新されました。再読込してください。" }, { status: 409 });
    }
    return NextResponse.json({ message: "ユーザが見つかりません。" }, { status: 404 });
  }

  return NextResponse.json({ user: result.user });
}
