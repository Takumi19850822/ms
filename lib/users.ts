import { AppUserRecord, Role, SessionUser } from "@/lib/types";
import { getSupabase, getSupabaseWithRls } from "@/lib/supabase";
import { hashPassword, verifyPassword } from "@/lib/password";

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
  const supabase = getSupabase();
  const existing = await supabase.from("AppUser").select("id").eq("email", ADMIN_EMAIL).maybeSingle();
  if (existing.error) {
    throw existing.error;
  }
  if (existing.data) {
    return;
  }

  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  const created = await supabase.from("AppUser").insert({
    id: crypto.randomUUID(),
    name: "本部 管理者",
    email: ADMIN_EMAIL,
    passwordHash,
    role: "admin",
    storeId: null,
    isActive: true,
    updatedAt: new Date().toISOString(),
    version: 1,
  });
  if (created.error) {
    throw created.error;
  }
}

export async function authenticateUser(email: string, password: string): Promise<SessionUser | null> {
  await ensureInitialAdminUser();
  const supabase = getSupabase();
  const result = await supabase
    .from("AppUser")
    .select("id,name,email,passwordHash,role,storeId,isActive,updatedAt,version")
    .eq("email", normalizeEmail(email))
    .eq("isActive", true)
    .maybeSingle<AppUserRow>();
  if (result.error) {
    throw result.error;
  }
  const data = result.data;
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

export async function listUsers(search: string, user: SessionUser): Promise<AppUserRecord[]> {
  const keyword = search.trim();
  const supabase = await getSupabaseWithRls(user);
  let request = supabase
    .from("AppUser")
    .select("id,name,email,role,storeId,isActive,updatedAt,version")
    .order("updatedAt", { ascending: false });
  if (keyword) {
    request = request.or(`name.ilike.%${keyword}%,email.ilike.%${keyword}%,role.ilike.%${keyword}%,storeId.ilike.%${keyword}%`);
  }
  const result = await request.returns<AppUserRow[]>();
  if (result.error) {
    throw result.error;
  }
  return result.data.map(toRecord);
}

export async function createUser(user: SessionUser, input?: Partial<UserUpdateInput>): Promise<AppUserRecord> {
  const email = normalizeEmail(input?.email || `user-${Date.now()}@example.com`);
  const passwordHash = await hashPassword(input?.password || "ChangeMe123!");
  const supabase = await getSupabaseWithRls(user);
  const result = await supabase
    .from("AppUser")
    .insert({
      id: crypto.randomUUID(),
      name: input?.name || "新規ユーザ",
      email,
      passwordHash,
      role: input?.role || "store",
      storeId: input?.storeId ?? null,
      isActive: input?.isActive ?? true,
      updatedAt: new Date().toISOString(),
      version: 1,
    })
    .select("id,name,email,role,storeId,isActive,updatedAt,version")
    .single<AppUserRow>();
  if (result.error) {
    throw result.error;
  }
  return toRecord(result.data);
}

export async function updateUser(
  actor: SessionUser,
  id: string,
  input: UserUpdateInput,
): Promise<
  | { ok: true; user: AppUserRecord }
  | { ok: false; reason: "not_found" | "version_conflict" | "forbidden" }
> {
  const supabase = await getSupabaseWithRls(actor);
  const targetResult = await supabase.from("AppUser").select("id,version").eq("id", id).maybeSingle<{ id: string; version: number }>();
  if (targetResult.error) {
    if (targetResult.error.code === "42501") {
      return { ok: false, reason: "forbidden" };
    }
    throw targetResult.error;
  }
  const target = targetResult.data;
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

  const result = await supabase
    .from("AppUser")
    .update({ ...updatePayload, updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select("id,name,email,role,storeId,isActive,updatedAt,version")
    .single<AppUserRow>();
  if (result.error) {
    if (result.error.code === "42501") {
      return { ok: false, reason: "forbidden" };
    }
    throw result.error;
  }
  return { ok: true, user: toRecord(result.data) };
}
