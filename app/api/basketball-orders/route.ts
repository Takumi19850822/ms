import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth";
import { createResourceFromPayload } from "@/lib/data";

const BASKETBALL_RESOURCE_ID = "orders-basketball";

type BasketballOrderSaveBody = {
  values?: Record<string, string>;
  orderType?: string;
  creationType?: string;
  savedAt?: string;
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

export async function POST(request: Request) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ message: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as BasketballOrderSaveBody;
  const payload = buildRecordPayload(body);
  const record = await createResourceFromPayload(BASKETBALL_RESOURCE_ID, session, payload);

  return NextResponse.json({ record }, { status: 201 });
}
