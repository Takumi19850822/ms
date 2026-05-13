import { SessionUser, ResourceRecord } from "@/lib/types";
import { RESOURCE_CONFIGS } from "@/lib/resources";
import { db } from "@/lib/db";

const STORE_IDS = ["store-a", "store-b"];
let schemaReady: Promise<void> | null = null;

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

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS "ResourceRecord" (
          id TEXT PRIMARY KEY,
          "resourceId" TEXT NOT NULL,
          code TEXT NOT NULL,
          name TEXT NOT NULL,
          "storeId" TEXT,
          note TEXT NOT NULL DEFAULT '',
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          version INTEGER NOT NULL DEFAULT 1,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await db.query(`CREATE INDEX IF NOT EXISTS "idx_resource_id" ON "ResourceRecord" ("resourceId");`);
      await db.query(
        `CREATE INDEX IF NOT EXISTS "idx_resource_store" ON "ResourceRecord" ("resourceId", "storeId");`,
      );
    })();
  }
  await schemaReady;
}

function toRecord(row: {
  id: string;
  code: string;
  name: string;
  storeId: string | null;
  note: string;
  updatedAt: Date | string;
  version: number;
}): ResourceRecord {
  const updatedAtIso =
    row.updatedAt instanceof Date ? row.updatedAt.toISOString() : new Date(String(row.updatedAt)).toISOString();
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    storeId: row.storeId,
    note: row.note,
    updatedAt: updatedAtIso,
    version: row.version,
  };
}

async function ensureSeeded(resourceId: string) {
  await ensureSchema();
  const countResult = await db.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM "ResourceRecord" WHERE "resourceId" = $1`,
    [resourceId],
  );
  const count = Number(countResult.rows[0]?.count ?? "0");
  if (count > 0) {
    return;
  }
  const seeds = seedRecords(resourceId);
  for (const item of seeds) {
    await db.query(
      `INSERT INTO "ResourceRecord" (id, "resourceId", code, name, "storeId", note, version)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [item.id, resourceId, item.code, item.name, item.storeId, item.note, item.version],
    );
  }
}

export async function listResource(resourceId: string, user: SessionUser, search: string): Promise<ResourceRecord[]> {
  await ensureSeeded(resourceId);
  const keyword = search.trim();
  const params: Array<string | null> = [resourceId];
  const where: string[] = [`"resourceId" = $1`];

  if (user.role === "store") {
    params.push(user.storeId);
    where.push(`"storeId" = $${params.length}`);
  }

  if (keyword) {
    params.push(`%${keyword}%`);
    const idx = params.length;
    where.push(
      `(code ILIKE $${idx} OR name ILIKE $${idx} OR note ILIKE $${idx} OR COALESCE("storeId", '') ILIKE $${idx})`,
    );
  }

  const result = await db.query<{
    id: string;
    code: string;
    name: string;
    storeId: string | null;
    note: string;
    updatedAt: Date | string;
    version: number;
  }>(
    `SELECT id, code, name, "storeId", note, "updatedAt", version
     FROM "ResourceRecord"
     WHERE ${where.join(" AND ")}
     ORDER BY "updatedAt" DESC`,
    params,
  );

  return result.rows.map(toRecord);
}

export async function createResource(resourceId: string, user: SessionUser): Promise<ResourceRecord> {
  await ensureSeeded(resourceId);
  const countResult = await db.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM "ResourceRecord" WHERE "resourceId" = $1`,
    [resourceId],
  );
  const nextNumber = Number(countResult.rows[0]?.count ?? "0") + 1;
  const storeId = user.role === "store" ? user.storeId : "store-a";

  const created = await db.query<{
    id: string;
    code: string;
    name: string;
    storeId: string | null;
    note: string;
    updatedAt: Date | string;
    version: number;
  }>(
    `INSERT INTO "ResourceRecord" ("resourceId", code, name, "storeId", note, version)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, code, name, "storeId", note, "updatedAt", version`,
    [resourceId, `${resourceId.toUpperCase().slice(0, 8)}-${nextNumber}`, "新規データ", storeId, "", 1],
  );
  return toRecord(created.rows[0]);
}

export async function updateResource(
  resourceId: string,
  id: string,
  user: SessionUser,
  payload: Pick<ResourceRecord, "code" | "name" | "storeId" | "note" | "version">,
): Promise<{ ok: true; record: ResourceRecord } | { ok: false; reason: "not_found" | "forbidden" | "version_conflict" }> {
  await ensureSeeded(resourceId);
  const targetResult = await db.query<{
    id: string;
    storeId: string | null;
    version: number;
  }>(
    `SELECT id, "storeId", version
     FROM "ResourceRecord"
     WHERE id = $1 AND "resourceId" = $2
     LIMIT 1`,
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
  const updated = await db.query<{
    id: string;
    code: string;
    name: string;
    storeId: string | null;
    note: string;
    updatedAt: Date | string;
    version: number;
  }>(
    `UPDATE "ResourceRecord"
     SET code = $1,
         name = $2,
         "storeId" = $3,
         note = $4,
         version = version + 1,
         "updatedAt" = NOW()
     WHERE id = $5
     RETURNING id, code, name, "storeId", note, "updatedAt", version`,
    [payload.code, payload.name, user.role === "store" ? user.storeId : payload.storeId, payload.note, id],
  );
  return { ok: true, record: toRecord(updated.rows[0]) };
}
