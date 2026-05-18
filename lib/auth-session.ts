import { Role, SessionUser } from "@/lib/types";
import { getSupabase, getSupabaseAnon } from "@/lib/supabase";

type ProfileRow = {
  id: string;
  name: string;
  role: string;
  store_id: string | null;
  is_active: boolean;
};

export type AuthTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

function assertRole(value: string): asserts value is Role {
  if (value !== "admin" && value !== "store" && value !== "store_all") {
    throw new Error("Invalid role in app_user_profile.");
  }
}

export async function resolveSessionFromTokens(tokens: AuthTokens): Promise<SessionUser | null> {
  if (!tokens.accessToken) {
    return null;
  }

  const authClient = getSupabaseAnon();
  const userResult = await authClient.auth.getUser(tokens.accessToken);
  if (userResult.error || !userResult.data.user) {
    return null;
  }

  const user = userResult.data.user;
  const adminClient = getSupabase();
  const profileResult = await adminClient
    .from("app_user_profile")
    .select("id,name,role,store_id,is_active")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (profileResult.error || !profileResult.data || !profileResult.data.is_active) {
    return null;
  }

  assertRole(profileResult.data.role);
  return {
    id: user.id,
    name: profileResult.data.name || user.user_metadata?.name || user.email || "",
    email: user.email || "",
    role: profileResult.data.role,
    storeId: profileResult.data.store_id,
  };
}
