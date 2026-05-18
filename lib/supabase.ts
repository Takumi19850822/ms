import { createClient } from "@supabase/supabase-js";
import { readRuntimeValue } from "@/lib/env";
import { createSupabaseRlsJwt } from "@/lib/supabase-rls-jwt";
import type { SessionUser } from "@/lib/types";

export function getSupabase() {
  return createClient(readRuntimeValue("SUPABASE_URL"), readRuntimeValue("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function getSupabaseWithRls(user: SessionUser) {
  const token = await createSupabaseRlsJwt(user);
  return createClient(readRuntimeValue("SUPABASE_URL"), readRuntimeValue("SUPABASE_ANON_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}
