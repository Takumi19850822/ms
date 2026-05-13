import { SessionUser, ResourceRecord } from "@/lib/types";
import { RESOURCE_CONFIGS } from "@/lib/resources";
import { prisma } from "@/lib/prisma";

const STORE_IDS = ["store-a", "store-b"];

function seedRecords(resourceId: string): ResourceRecord[] {
  return Array.from({ length: 6 }).map((_, idx) => {
    const storeId = STORE_IDS[idx % STORE_IDS.length];
    return {
      id: crypto.randomUUID(),
      code: `${resourceId.toUpperCase().slice(0, 8)}-${idx + 1}`,
      name: `${RESOURCE_CONFIGS[resourceId]?.title ?? resourceId} ${idx + 1}`,
      storeId,
      note: idx % 2 === 0 ? "初期データ" : "",
      updatedAt: new Date().toISOString(),
      version: 1,
    };
  });
}

function whereByRole(user: SessionUser): { storeId?: string } {
  if (user.role === "store") {
    return { storeId: user.storeId ?? "" };
  }
  return {};
}

function toRecord(row: {
  id: string;
  code: string;
  name: string;
  storeId: string | null;
  note: string;
  updatedAt: Date;
  version: number;
}): ResourceRecord {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    storeId: row.storeId,
    note: row.note,
    updatedAt: row.updatedAt.toISOString(),
    version: row.version,
  };
}

async function ensureSeeded(resourceId: string) {
  const count = await prisma.resourceRecord.count({ where: { resourceId } });
  if (count > 0) {
    return;
  }
  const seeds = seedRecords(resourceId);
  await prisma.resourceRecord.createMany({
    data: seeds.map((item) => ({
      id: item.id,
      resourceId,
      code: item.code,
      name: item.name,
      storeId: item.storeId,
      note: item.note,
      version: item.version,
    })),
  });
}

export async function listResource(resourceId: string, user: SessionUser, search: string): Promise<ResourceRecord[]> {
  await ensureSeeded(resourceId);

  const keyword = search.trim();
  const rows = await prisma.resourceRecord.findMany({
    where: {
      resourceId,
      ...whereByRole(user),
      ...(keyword
        ? {
            OR: [
              { code: { contains: keyword, mode: "insensitive" } },
              { name: { contains: keyword, mode: "insensitive" } },
              { note: { contains: keyword, mode: "insensitive" } },
              { storeId: { contains: keyword, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ updatedAt: "desc" }],
  });
  return rows.map(toRecord);
}

export async function createResource(resourceId: string, user: SessionUser): Promise<ResourceRecord> {
  await ensureSeeded(resourceId);

  const nextNumber = (await prisma.resourceRecord.count({ where: { resourceId } })) + 1;
  const created = await prisma.resourceRecord.create({
    data: {
      resourceId,
    code: `${resourceId.toUpperCase().slice(0, 8)}-${nextNumber}`,
      name: "新規データ",
      storeId: user.role === "store" ? user.storeId : "store-a",
      note: "",
      version: 1,
    },
  });
  return toRecord(created);
}

export async function updateResource(
  resourceId: string,
  id: string,
  user: SessionUser,
  payload: Pick<ResourceRecord, "code" | "name" | "storeId" | "note" | "version">,
): Promise<{ ok: true; record: ResourceRecord } | { ok: false; reason: "not_found" | "forbidden" | "version_conflict" }> {
  await ensureSeeded(resourceId);

  const target = await prisma.resourceRecord.findFirst({
    where: {
      id,
      resourceId,
    },
  });
  if (!target) {
    return { ok: false, reason: "not_found" };
  }
  if (user.role === "store" && target.storeId !== user.storeId) {
    return { ok: false, reason: "forbidden" };
  }
  if (payload.version !== target.version) {
    return { ok: false, reason: "version_conflict" };
  }
  const updated = await prisma.resourceRecord.update({
    where: { id: target.id },
    data: {
      code: payload.code,
      name: payload.name,
      storeId: user.role === "store" ? user.storeId : payload.storeId,
      note: payload.note,
      version: { increment: 1 },
    },
  });
  return { ok: true, record: toRecord(updated) };
}
