import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth";
import { updateResource } from "@/lib/data";

const BASKETBALL_RESOURCE_ID = "orders-basketball";

type Params = {
  params: Promise<{ id: string }>;
};

type BasketballOrderSaveBody = {
  values?: Record<string, string>;
  version?: number;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function buildRecordPayload(body: BasketballOrderSaveBody) {
  const values = body.values ?? {};
  const code =
    text(values.watasakuOrderNo) ||
    text(values.megaSportsPoNo) ||
    text(values.previousPoNo) ||
    `BASKET-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}`;
  const name = [text(values.teamName), text(values.customerName)].filter(Boolean).join(" / ") || "バスケオーダー";
  const storeId = text(values.storeCode) || null;

  return {
    code,
    name,
    storeId,
    note: JSON.stringify(body),
  };
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ message: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as BasketballOrderSaveBody;
  if (body.version === undefined) {
    return NextResponse.json({ message: "保存対象のバージョンが不足しています。" }, { status: 400 });
  }

  const payload = buildRecordPayload(body);
  const result = await updateResource(BASKETBALL_RESOURCE_ID, id, session, {
    ...payload,
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
