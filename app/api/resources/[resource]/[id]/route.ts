import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth";
import { updateResource } from "@/lib/data";
import { RESOURCE_CONFIGS } from "@/lib/resources";

type Params = {
  params: Promise<{ resource: string; id: string }>;
};

type UpdatePayload = {
  code?: string;
  name?: string;
  storeId?: string | null;
  note?: string;
  version?: number;
};

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ message: "unauthorized" }, { status: 401 });
  }
  const { resource, id } = await params;
  if (!RESOURCE_CONFIGS[resource]) {
    return NextResponse.json({ message: "not found" }, { status: 404 });
  }

  const body = (await request.json()) as UpdatePayload;
  if (!body.code || !body.name || body.version === undefined) {
    return NextResponse.json({ message: "入力値が不足しています。" }, { status: 400 });
  }

  const result = await updateResource(resource, id, session, {
    code: body.code,
    name: body.name,
    storeId: body.storeId ?? null,
    note: body.note ?? "",
    version: body.version,
  });

  if (!result.ok) {
    if (result.reason === "forbidden") {
      return NextResponse.json({ message: "編集権限がありません。" }, { status: 403 });
    }
    if (result.reason === "version_conflict") {
      return NextResponse.json({ message: "他ユーザに更新されました。再読込してください。" }, { status: 409 });
    }
    return NextResponse.json({ message: "データが見つかりません。" }, { status: 404 });
  }

  return NextResponse.json({ record: result.record });
}
