import { createClient } from "@supabase/supabase-js";
import { readRuntimeValue } from "@/lib/env";

export function getSupabase() {
  return createClient(readRuntimeValue("SUPABASE_URL"), readRuntimeValue("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getSupabaseAnon(accessToken?: string) {
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return createClient(readRuntimeValue("SUPABASE_URL"), readRuntimeValue("SUPABASE_ANON_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers,
    },
  });
}
