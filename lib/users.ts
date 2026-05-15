import { AppUserRecord, Role, SessionUser } from "@/lib/types";
import { query } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { QueryResultRow } from "pg";

const ADMIN_EMAIL = "hq@example.com";
const ADMIN_PASSWORD = "pass1234";

type AppUserRow = QueryResultRow & {
  id: string;
  name: string;
  email: string;
  role: string;
  storeId: string | null;
  isActive: boolean;
  updatedAt: Date;
  version: number;
  passwordHash?: string;
};

type UserUpdateInput = {
  name: string;
  email: string;
  role: Role;
  storeId: string | null;
  isActive: boolean;
  version: number;
  password?: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function assertRole(value: string): asserts value is Role {
  if (value !== "admin" && value !== "store" && value !== "store_all") {
    throw new Error("Invalid role.");
  }
}

function toRecord(row: AppUserRow): AppUserRecord {
  assertRole(row.role);
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    storeId: row.storeId,
    isActive: row.isActive,
    updatedAt: new Date(row.updatedAt).toISOString(),
    version: row.version,
  };
}

export async function ensureInitialAdminUser() {
  const existing = await query<QueryResultRow & { id: string }>('SELECT id FROM "AppUser" WHERE email = $1 LIMIT 1', [
    ADMIN_EMAIL,
  ]);
  if (existing.rowCount) {
    return;
  }

  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  await query(
    `INSERT INTO "AppUser" (id, name, email, "passwordHash", role, "storeId", "isActive", "updatedAt", version)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [crypto.randomUUID(), "本部 管理者", ADMIN_EMAIL, passwordHash, "admin", null, true, new Date().toISOString(), 1],
  );
}

export async function authenticateUser(email: string, password: string): Promise<SessionUser | null> {
  await ensureInitialAdminUser();
  const result = await query<AppUserRow>(
    `SELECT id, name, email, "passwordHash", role, "storeId", "isActive", "updatedAt", version
     FROM "AppUser"
     WHERE email = $1 AND "isActive" = true
     LIMIT 1`,
    [normalizeEmail(email)],
  );
  const data = result.rows[0];
  if (!data?.passwordHash) {
    return null;
  }
  const verified = await verifyPassword(password, data.passwordHash);
  if (!verified) {
    return null;
  }
  assertRole(data.role);
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    storeId: data.storeId,
  };
}

export async function listUsers(search: string): Promise<AppUserRecord[]> {
  await ensureInitialAdminUser();
  const keyword = search.trim();
  const result = keyword
    ? await query<AppUserRow>(
        `SELECT id, name, email, role, "storeId", "isActive", "updatedAt", version
         FROM "AppUser"
         WHERE name ILIKE $1 OR email ILIKE $1 OR role ILIKE $1 OR "storeId" ILIKE $1
         ORDER BY "updatedAt" DESC`,
        [`%${keyword}%`],
      )
    : await query<AppUserRow>(
        `SELECT id, name, email, role, "storeId", "isActive", "updatedAt", version
         FROM "AppUser"
         ORDER BY "updatedAt" DESC`,
      );
  return result.rows.map(toRecord);
}

export async function createUser(input?: Partial<UserUpdateInput>): Promise<AppUserRecord> {
  await ensureInitialAdminUser();
  const email = normalizeEmail(input?.email || `user-${Date.now()}@example.com`);
  const passwordHash = await hashPassword(input?.password || "ChangeMe123!");
  const result = await query<AppUserRow>(
    `INSERT INTO "AppUser" (id, name, email, "passwordHash", role, "storeId", "isActive", "updatedAt", version)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, name, email, role, "storeId", "isActive", "updatedAt", version`,
    [
      crypto.randomUUID(),
      input?.name || "新規ユーザ",
      email,
      passwordHash,
      input?.role || "store",
      input?.storeId ?? null,
      input?.isActive ?? true,
      new Date().toISOString(),
      1,
    ],
  );
  return toRecord(result.rows[0]);
}

export async function updateUser(id: string, input: UserUpdateInput): Promise<
  | { ok: true; user: AppUserRecord }
  | { ok: false; reason: "not_found" | "version_conflict" }
> {
  const targetResult = await query<QueryResultRow & { id: string; version: number }>(
    'SELECT id, version FROM "AppUser" WHERE id = $1 LIMIT 1',
    [id],
  );
  const target = targetResult.rows[0];
  if (!target) {
    return { ok: false, reason: "not_found" };
  }
  if (target.version !== input.version) {
    return { ok: false, reason: "version_conflict" };
  }

  const updatePayload: {
    name: string;
    email: string;
    role: Role;
    storeId: string | null;
    isActive: boolean;
    version: number;
    passwordHash?: string;
  } = {
    name: input.name,
    email: normalizeEmail(input.email),
    role: input.role,
    storeId: input.role === "store" ? input.storeId : null,
    isActive: input.isActive,
    version: input.version + 1,
  };

  if (input.password) {
    updatePayload.passwordHash = await hashPassword(input.password);
  }

  const result = updatePayload.passwordHash
    ? await query<AppUserRow>(
        `UPDATE "AppUser"
         SET name = $1, email = $2, role = $3, "storeId" = $4, "isActive" = $5, version = $6, "passwordHash" = $7, "updatedAt" = $8
         WHERE id = $9
         RETURNING id, name, email, role, "storeId", "isActive", "updatedAt", version`,
        [
          updatePayload.name,
          updatePayload.email,
          updatePayload.role,
          updatePayload.storeId,
          updatePayload.isActive,
          updatePayload.version,
          updatePayload.passwordHash,
          new Date().toISOString(),
          id,
        ],
      )
    : await query<AppUserRow>(
        `UPDATE "AppUser"
         SET name = $1, email = $2, role = $3, "storeId" = $4, "isActive" = $5, version = $6, "updatedAt" = $7
         WHERE id = $8
         RETURNING id, name, email, role, "storeId", "isActive", "updatedAt", version`,
        [
          updatePayload.name,
          updatePayload.email,
          updatePayload.role,
          updatePayload.storeId,
          updatePayload.isActive,
          updatePayload.version,
          new Date().toISOString(),
          id,
        ],
      );
  return { ok: true, user: toRecord(result.rows[0]) };
}
