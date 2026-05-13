import { AppUserRecord, Role, SessionUser } from "@/lib/types";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getSupabase } from "@/lib/supabase";

const USER_SELECT = "id, name, email, role, storeId, isActive, updatedAt, version";
const ADMIN_EMAIL = "hq@example.com";
const ADMIN_PASSWORD = "pass1234";

type AppUserRow = AppUserRecord & {
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
  const { data, error } = await supabase.from("AppUser").select("id").eq("email", ADMIN_EMAIL).maybeSingle();
  if (error) {
    throw error;
  }
  if (data) {
    return;
  }

  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  const { error: insertError } = await supabase.from("AppUser").insert({
    id: crypto.randomUUID(),
    name: "本部 管理者",
    email: ADMIN_EMAIL,
    passwordHash,
    role: "admin",
    storeId: null,
    isActive: true,
    version: 1,
    updatedAt: new Date().toISOString(),
  });
  if (insertError) {
    throw insertError;
  }
}

export async function authenticateUser(email: string, password: string): Promise<SessionUser | null> {
  await ensureInitialAdminUser();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("AppUser")
    .select("id, name, email, passwordHash, role, storeId, isActive")
    .eq("email", normalizeEmail(email))
    .eq("isActive", true)
    .maybeSingle<AppUserRow>();

  if (error) {
    throw error;
  }
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
  const supabase = getSupabase();
  const keyword = search.trim();
  let request = supabase.from("AppUser").select(USER_SELECT).order("updatedAt", { ascending: false });

  if (keyword) {
    const escaped = keyword.replaceAll(",", "\\,");
    request = request.or(`name.ilike.%${escaped}%,email.ilike.%${escaped}%,role.ilike.%${escaped}%,storeId.ilike.%${escaped}%`);
  }

  const { data, error } = await request.returns<AppUserRow[]>();
  if (error) {
    throw error;
  }
  return (data ?? []).map(toRecord);
}

export async function createUser(input?: Partial<UserUpdateInput>): Promise<AppUserRecord> {
  await ensureInitialAdminUser();
  const supabase = getSupabase();
  const email = normalizeEmail(input?.email || `user-${Date.now()}@example.com`);
  const passwordHash = await hashPassword(input?.password || "ChangeMe123!");
  const { data, error } = await supabase
    .from("AppUser")
    .insert({
      id: crypto.randomUUID(),
      name: input?.name || "新規ユーザ",
      email,
      passwordHash,
      role: input?.role || "store",
      storeId: input?.storeId ?? null,
      isActive: input?.isActive ?? true,
      version: 1,
      updatedAt: new Date().toISOString(),
    })
    .select(USER_SELECT)
    .single<AppUserRow>();

  if (error) {
    throw error;
  }
  return toRecord(data);
}

export async function updateUser(id: string, input: UserUpdateInput): Promise<
  | { ok: true; user: AppUserRecord }
  | { ok: false; reason: "not_found" | "version_conflict" }
> {
  const supabase = getSupabase();
  const { data: target, error: targetError } = await supabase
    .from("AppUser")
    .select("id, version")
    .eq("id", id)
    .maybeSingle<{ id: string; version: number }>();

  if (targetError) {
    throw targetError;
  }
  if (!target) {
    return { ok: false, reason: "not_found" };
  }
  if (target.version !== input.version) {
    return { ok: false, reason: "version_conflict" };
  }

  const updatePayload: Record<string, string | number | boolean | null> = {
    name: input.name,
    email: normalizeEmail(input.email),
    role: input.role,
    storeId: input.role === "store" ? input.storeId : null,
    isActive: input.isActive,
    version: input.version + 1,
    updatedAt: new Date().toISOString(),
  };

  if (input.password) {
    updatePayload.passwordHash = await hashPassword(input.password);
  }

  const { data, error } = await supabase
    .from("AppUser")
    .update(updatePayload)
    .eq("id", id)
    .select(USER_SELECT)
    .single<AppUserRow>();

  if (error) {
    throw error;
  }
  return { ok: true, user: toRecord(data) };
}
