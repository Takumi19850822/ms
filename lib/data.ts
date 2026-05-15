import { SessionUser, ResourceRecord } from "@/lib/types";
import { RESOURCE_CONFIGS } from "@/lib/resources";
import { query } from "@/lib/db";
import type { QueryResultRow } from "pg";

const STORE_IDS = ["store-a", "store-b"];

type ResourceRow = QueryResultRow & {
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
  const countResult = await query<QueryResultRow & { count: number }>(
    'SELECT COUNT(*)::int AS count FROM "ResourceRecord" WHERE "resourceId" = $1',
    [resourceId],
  );
  if ((countResult.rows[0]?.count ?? 0) > 0) {
    return;
  }

  const seeds = seedRecords(resourceId);
  await Promise.all(
    seeds.map((item) =>
      query(
        `INSERT INTO "ResourceRecord" (id, "resourceId", code, name, "storeId", note, "updatedAt", version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [item.id, resourceId, item.code, item.name, item.storeId, item.note, item.updatedAt, item.version],
      ),
    ),
  );
}

export async function listResource(resourceId: string, user: SessionUser, search: string): Promise<ResourceRecord[]> {
  await ensureSeeded(resourceId);
  return listResourceRecords(resourceId, user, search);
}

export async function listResourceRecords(resourceId: string, user: SessionUser, search: string): Promise<ResourceRecord[]> {
  const keyword = search.trim();
  const conditions = ['"resourceId" = $1'];
  const params: unknown[] = [resourceId];
  if (user.role === "store") {
    params.push(user.storeId);
    conditions.push(`"storeId" = $${params.length}`);
  }
  if (keyword) {
    params.push(`%${keyword}%`);
    conditions.push(
      `(code ILIKE $${params.length} OR name ILIKE $${params.length} OR note ILIKE $${params.length} OR "storeId" ILIKE $${params.length})`,
    );
  }
  const result = await query<ResourceRow>(
    `SELECT id, "resourceId", code, name, "storeId", note, "updatedAt", version
     FROM "ResourceRecord"
     WHERE ${conditions.join(" AND ")}
     ORDER BY "updatedAt" DESC`,
    params,
  );

  return result.rows.map(toRecord);
}

export async function getResourceRecord(resourceId: string, id: string, user: SessionUser): Promise<ResourceRecord | null> {
  const conditions = ['"resourceId" = $1', "id = $2"];
  const params: unknown[] = [resourceId, id];
  if (user.role === "store") {
    params.push(user.storeId);
    conditions.push(`"storeId" = $${params.length}`);
  }
  const result = await query<ResourceRow>(
    `SELECT id, "resourceId", code, name, "storeId", note, "updatedAt", version
     FROM "ResourceRecord"
     WHERE ${conditions.join(" AND ")}
     LIMIT 1`,
    params,
  );

  return result.rows[0] ? toRecord(result.rows[0]) : null;
}

export async function createResource(resourceId: string, user: SessionUser): Promise<ResourceRecord> {
  await ensureSeeded(resourceId);
  const countResult = await query<QueryResultRow & { count: number }>(
    'SELECT COUNT(*)::int AS count FROM "ResourceRecord" WHERE "resourceId" = $1',
    [resourceId],
  );

  const nextNumber = (countResult.rows[0]?.count ?? 0) + 1;
  const storeId = user.role === "store" ? user.storeId : "store-a";

  const result = await query<ResourceRow>(
    `INSERT INTO "ResourceRecord" (id, "resourceId", code, name, "storeId", note, "updatedAt", version)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, "resourceId", code, name, "storeId", note, "updatedAt", version`,
    [
      crypto.randomUUID(),
      resourceId,
      `${resourceId.toUpperCase().slice(0, 8)}-${nextNumber}`,
      "新規データ",
      storeId,
      "",
      new Date().toISOString(),
      1,
    ],
  );

  return toRecord(result.rows[0]);
}

export async function createResourceFromPayload(
  resourceId: string,
  user: SessionUser,
  payload: Pick<ResourceRecord, "code" | "name" | "storeId" | "note">,
): Promise<ResourceRecord> {
  const storeId = user.role === "store" ? user.storeId : payload.storeId;

  const result = await query<ResourceRow>(
    `INSERT INTO "ResourceRecord" (id, "resourceId", code, name, "storeId", note, "updatedAt", version)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, "resourceId", code, name, "storeId", note, "updatedAt", version`,
    [crypto.randomUUID(), resourceId, payload.code, payload.name, storeId, payload.note, new Date().toISOString(), 1],
  );

  return toRecord(result.rows[0]);
}

export async function updateResource(
  resourceId: string,
  id: string,
  user: SessionUser,
  payload: Pick<ResourceRecord, "code" | "name" | "storeId" | "note" | "version">,
): Promise<{ ok: true; record: ResourceRecord } | { ok: false; reason: "not_found" | "forbidden" | "version_conflict" }> {
  await ensureSeeded(resourceId);
  const targetResult = await query<QueryResultRow & { id: string; storeId: string | null; version: number }>(
    'SELECT id, "storeId", version FROM "ResourceRecord" WHERE id = $1 AND "resourceId" = $2 LIMIT 1',
    [id, resourceId],
  );
  const target = targetResult.rows[0];
  if (!target) {
    return { ok: false, reason: "not_found" };
  }
  if (user.role === "store" && target.storeId !== user.storeId) {
    return { ok: false, reason: "forbidden" };
  }
  if (payload.version !== target.version) {
    return { ok: false, reason: "version_conflict" };
  }

  const result = await query<ResourceRow>(
    `UPDATE "ResourceRecord"
     SET code = $1, name = $2, "storeId" = $3, note = $4, version = $5, "updatedAt" = $6
     WHERE id = $7
     RETURNING id, "resourceId", code, name, "storeId", note, "updatedAt", version`,
    [
      payload.code,
      payload.name,
      user.role === "store" ? user.storeId : payload.storeId,
      payload.note,
      target.version + 1,
      new Date().toISOString(),
      id,
    ],
  );

  return { ok: true, record: toRecord(result.rows[0]) };
}
