import { SessionUser, ResourceRecord } from "@/lib/types";
import { RESOURCE_CONFIGS } from "@/lib/resources";
import { prisma } from "@/lib/prisma";

const STORE_IDS = ["store-a", "store-b"];

type ResourceRow = {
  id: string;
  resourceId: string;
  code: string;
  name: string;
  storeId: string | null;
  note: string;
  updatedAt: Date;
  version: number;
};

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

function toRecord(row: ResourceRow): ResourceRecord {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    storeId: row.storeId,
    note: row.note,
    updatedAt: new Date(row.updatedAt).toISOString(),
    version: row.version,
  };
}

async function ensureSeeded(resourceId: string) {
  const count = await prisma.resourceRecord.count({
    where: { resourceId },
  });
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
      updatedAt: item.updatedAt,
      version: item.version,
    })),
  });
}

export async function listResource(resourceId: string, user: SessionUser, search: string): Promise<ResourceRecord[]> {
  await ensureSeeded(resourceId);
  return listResourceRecords(resourceId, user, search);
}

export async function listResourceRecords(resourceId: string, user: SessionUser, search: string): Promise<ResourceRecord[]> {
  const keyword = search.trim();
  const rows = await prisma.resourceRecord.findMany({
    where: {
      resourceId,
      ...(user.role === "store" ? { storeId: user.storeId } : {}),
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
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      resourceId: true,
      code: true,
      name: true,
      storeId: true,
      note: true,
      updatedAt: true,
      version: true,
    },
  });

  return rows.map(toRecord);
}

export async function getResourceRecord(resourceId: string, id: string, user: SessionUser): Promise<ResourceRecord | null> {
  const data = await prisma.resourceRecord.findFirst({
    where: {
      resourceId,
      id,
      ...(user.role === "store" ? { storeId: user.storeId } : {}),
    },
    select: {
      id: true,
      resourceId: true,
      code: true,
      name: true,
      storeId: true,
      note: true,
      updatedAt: true,
      version: true,
    },
  });

  return data ? toRecord(data) : null;
}

export async function createResource(resourceId: string, user: SessionUser): Promise<ResourceRecord> {
  await ensureSeeded(resourceId);
  const count = await prisma.resourceRecord.count({
    where: { resourceId },
  });

  const nextNumber = count + 1;
  const storeId = user.role === "store" ? user.storeId : "store-a";

  const data = await prisma.resourceRecord.create({
    data: {
      id: crypto.randomUUID(),
      resourceId,
      code: `${resourceId.toUpperCase().slice(0, 8)}-${nextNumber}`,
      name: "新規データ",
      storeId,
      note: "",
      updatedAt: new Date().toISOString(),
      version: 1,
    },
    select: {
      id: true,
      resourceId: true,
      code: true,
      name: true,
      storeId: true,
      note: true,
      updatedAt: true,
      version: true,
    },
  });

  return toRecord(data);
}

export async function createResourceFromPayload(
  resourceId: string,
  user: SessionUser,
  payload: Pick<ResourceRecord, "code" | "name" | "storeId" | "note">,
): Promise<ResourceRecord> {
  const storeId = user.role === "store" ? user.storeId : payload.storeId;

  const data = await prisma.resourceRecord.create({
    data: {
      id: crypto.randomUUID(),
      resourceId,
      code: payload.code,
      name: payload.name,
      storeId,
      note: payload.note,
      updatedAt: new Date().toISOString(),
      version: 1,
    },
    select: {
      id: true,
      resourceId: true,
      code: true,
      name: true,
      storeId: true,
      note: true,
      updatedAt: true,
      version: true,
    },
  });

  return toRecord(data);
}

export async function updateResource(
  resourceId: string,
  id: string,
  user: SessionUser,
  payload: Pick<ResourceRecord, "code" | "name" | "storeId" | "note" | "version">,
): Promise<{ ok: true; record: ResourceRecord } | { ok: false; reason: "not_found" | "forbidden" | "version_conflict" }> {
  await ensureSeeded(resourceId);
  const target = await prisma.resourceRecord.findFirst({
    where: { id, resourceId },
    select: { id: true, storeId: true, version: true },
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

  const data = await prisma.resourceRecord.update({
    where: { id },
    data: {
      code: payload.code,
      name: payload.name,
      storeId: user.role === "store" ? user.storeId : payload.storeId,
      note: payload.note,
      version: target.version + 1,
      updatedAt: new Date().toISOString(),
    },
    select: {
      id: true,
      resourceId: true,
      code: true,
      name: true,
      storeId: true,
      note: true,
      updatedAt: true,
      version: true,
    },
  });

  return { ok: true, record: toRecord(data) };
}
