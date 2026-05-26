import { getAppUrl } from "@/lib/app-url";
import { AppUserRecord, Role, SessionUser } from "@/lib/types";
import { getSupabase } from "@/lib/supabase";

type UserUpdateInput = {
  name: string;
  email: string;
  role: Role;
  storeId: string | null;
  isActive: boolean;
  version: number;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function assertRole(value: unknown): asserts value is Role {
  if (value !== "admin" && value !== "store" && value !== "store_all") {
    throw new Error("Invalid role.");
  }
}

function assertAdmin(user: SessionUser) {
  if (user.role !== "admin") {
    throw new Error("Forbidden.");
  }
}

type ProfileRow = {
  id: string;
  name: string;
  role: string;
  store_id: string | null;
  is_active: boolean;
  version: number;
  updated_at: string;
};

function mapRecord(profile: ProfileRow, email: string): AppUserRecord {
  assertRole(profile.role);
  return {
    id: profile.id,
    name: profile.name,
    email,
    role: profile.role,
    storeId: profile.store_id,
    isActive: profile.is_active,
    version: profile.version,
    updatedAt: new Date(profile.updated_at).toISOString(),
  };
}

async function listAllAuthUsersById() {
  const supabase = getSupabase();
  const usersById = new Map<string, { id: string; email: string }>();
  let page = 1;
  while (true) {
    const result = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (result.error) {
      throw result.error;
    }
    const users = result.data.users;
    for (const user of users) {
      usersById.set(user.id, { id: user.id, email: user.email ?? "" });
    }
    if (users.length < 200) {
      break;
    }
    page += 1;
  }
  return usersById;
}

export async function listUsers(search: string, user: SessionUser): Promise<AppUserRecord[]> {
  assertAdmin(user);
  const keyword = search.trim();
  const supabase = getSupabase();
  const profileResult = await supabase
    .from("app_user_profile")
    .select("id,name,role,store_id,is_active,version,updated_at")
    .order("updated_at", { ascending: false })
    .returns<ProfileRow[]>();
  if (profileResult.error) {
    throw profileResult.error;
  }

  const usersById = await listAllAuthUsersById();
  let rows = profileResult.data.map((profile) => mapRecord(profile, usersById.get(profile.id)?.email ?? ""));
  if (keyword) {
    const lower = keyword.toLowerCase();
    rows = rows.filter((row) =>
      [row.name, row.email, row.role, row.storeId ?? "", row.isActive ? "有効" : "無効"].join(" ").toLowerCase().includes(lower),
    );
  }
  return rows;
}

function authAdminErrorMessage(error: { message?: string } | null | undefined, fallback: string): string {
  const message = error?.message ?? fallback;
  if (message.toLowerCase().includes("invalid api key")) {
    return "Supabase の SUPABASE_SERVICE_ROLE_KEY が無効です。Dashboard > Project Settings > API から再取得して .env を更新してください。";
  }
  return message;
}

async function createAuthUser(supabase: ReturnType<typeof getSupabase>, email: string, input?: Partial<UserUpdateInput>) {
  const displayName = input?.name || "新規ユーザ";
  const inviteResult = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${getAppUrl()}/login`,
    data: { name: displayName },
  });
  if (inviteResult.error || !inviteResult.data.user) {
    throw new Error(authAdminErrorMessage(inviteResult.error, "招待メールの送信に失敗しました。"));
  }
  return inviteResult.data.user;
}

export async function createUser(user: SessionUser, input?: Partial<UserUpdateInput>): Promise<AppUserRecord> {
  assertAdmin(user);
  const email = normalizeEmail(input?.email ?? "");
  if (!email) {
    throw new Error("Email is required.");
  }
  const supabase = getSupabase();
  const authUser = await createAuthUser(supabase, email, input);

  const role = input?.role ?? "store";
  assertRole(role);
  const profileResult = await supabase
    .from("app_user_profile")
    .upsert(
      {
        id: authUser.id,
        name: input?.name || "新規ユーザ",
        role,
        store_id: role === "store" ? (input?.storeId ?? null) : null,
        is_active: input?.isActive ?? true,
      },
      { onConflict: "id" },
    )
    .select("id,name,role,store_id,is_active,version,updated_at")
    .single<ProfileRow>();
  if (profileResult.error) {
    throw new Error(
      profileResult.error.message.includes("app_user_profile")
        ? "app_user_profile テーブルが未作成です。rls_app_user.sql を Supabase SQL Editor で実行してください。"
        : profileResult.error.message,
    );
  }
  return mapRecord(profileResult.data, email);
}

export async function updateUser(
  actor: SessionUser,
  id: string,
  input: UserUpdateInput,
): Promise<
  | { ok: true; user: AppUserRecord }
  | { ok: false; reason: "not_found" | "version_conflict" | "forbidden" }
> {
  assertAdmin(actor);
  const supabase = getSupabase();
  const targetResult = await supabase
    .from("app_user_profile")
    .select("id,version")
    .eq("id", id)
    .maybeSingle<{ id: string; version: number }>();
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

  const normalizedEmail = normalizeEmail(input.email);
  const authUpdateResult = await supabase.auth.admin.updateUserById(id, { email: normalizedEmail });
  if (authUpdateResult.error) {
    throw authUpdateResult.error;
  }

  const result = await supabase
    .from("app_user_profile")
    .update({
      name: input.name,
      role: input.role,
      store_id: input.role === "store" ? input.storeId : null,
      is_active: input.isActive,
      version: input.version + 1,
    })
    .eq("id", id)
    .select("id,name,role,store_id,is_active,version,updated_at")
    .single<ProfileRow>();
  if (result.error) {
    if (result.error.code === "42501") {
      return { ok: false, reason: "forbidden" };
    }
    throw result.error;
  }

  return { ok: true, user: mapRecord(result.data, normalizedEmail) };
}
