import { notFound } from "next/navigation";
import { BasketballOrderForm } from "@/components/BasketballOrderForm";
import { getSessionFromCookie } from "@/lib/auth";
import { getResourceRecord } from "@/lib/data";

const BASKETBALL_RESOURCE_ID = "orders-basketball";

type Props = {
  params: Promise<{ id: string }>;
};

function parseOrderNote(note: string) {
  try {
    const parsed = JSON.parse(note) as unknown;
    return parsed && typeof parsed === "object" ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export default async function BasketballOrderDetailPage({ params }: Props) {
  const session = await getSessionFromCookie();
  if (!session) {
    notFound();
  }

  const { id } = await params;
  const record = await getResourceRecord(BASKETBALL_RESOURCE_ID, id, session);
  if (!record) {
    notFound();
  }

  return (
    <BasketballOrderForm
      initialRecord={{
        id: record.id,
        code: record.code,
        name: record.name,
        updatedAt: record.updatedAt,
        version: record.version,
      }}
      initialOrder={parseOrderNote(record.note)}
    />
  );
}
