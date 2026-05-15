import { AppUserRecord, Role, SessionUser } from "@/lib/types";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "hq@example.com";
const ADMIN_PASSWORD = "pass1234";

type AppUserRow = {
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
  const existing = await prisma.appUser.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { id: true },
  });
  if (existing) {
    return;
  }

  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  await prisma.appUser.create({
    data: {
      id: crypto.randomUUID(),
      name: "本部 管理者",
      email: ADMIN_EMAIL,
      passwordHash,
      role: "admin",
      storeId: null,
      isActive: true,
      version: 1,
    },
  });
}

export async function authenticateUser(email: string, password: string): Promise<SessionUser | null> {
  await ensureInitialAdminUser();
  const data = await prisma.appUser.findFirst({
    where: {
      email: normalizeEmail(email),
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      role: true,
      storeId: true,
      isActive: true,
    },
  });
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
  const rows = await prisma.appUser.findMany({
    where: keyword
      ? {
          OR: [
            { name: { contains: keyword, mode: "insensitive" } },
            { email: { contains: keyword, mode: "insensitive" } },
            { role: { contains: keyword, mode: "insensitive" } },
            { storeId: { contains: keyword, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      storeId: true,
      isActive: true,
      updatedAt: true,
      version: true,
    },
  });
  return rows.map(toRecord);
}

export async function createUser(input?: Partial<UserUpdateInput>): Promise<AppUserRecord> {
  await ensureInitialAdminUser();
  const email = normalizeEmail(input?.email || `user-${Date.now()}@example.com`);
  const passwordHash = await hashPassword(input?.password || "ChangeMe123!");
  const data = await prisma.appUser.create({
    data: {
      id: crypto.randomUUID(),
      name: input?.name || "新規ユーザ",
      email,
      passwordHash,
      role: input?.role || "store",
      storeId: input?.storeId ?? null,
      isActive: input?.isActive ?? true,
      version: 1,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      storeId: true,
      isActive: true,
      updatedAt: true,
      version: true,
    },
  });
  return toRecord(data);
}

export async function updateUser(id: string, input: UserUpdateInput): Promise<
  | { ok: true; user: AppUserRecord }
  | { ok: false; reason: "not_found" | "version_conflict" }
> {
  const target = await prisma.appUser.findUnique({
    where: { id },
    select: { id: true, version: true },
  });
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

  const data = await prisma.appUser.update({
    where: { id },
    data: updatePayload,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      storeId: true,
      isActive: true,
      updatedAt: true,
      version: true,
    },
  });
  return { ok: true, user: toRecord(data) };
}
