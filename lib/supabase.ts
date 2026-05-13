import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createClient } from "@supabase/supabase-js";

function readRuntimeValue(name: string): string {
  const processValue = process.env[name];
  if (processValue) {
    return processValue;
  }

  try {
    const { env } = getCloudflareContext();
    const bindingValue = (env as Record<string, string | undefined>)[name];
    if (bindingValue) {
      return bindingValue;
    }
  } catch {
    // Not running inside the Cloudflare runtime.
  }

  throw new Error(`${name} is not configured.`);
}

export function getSupabase() {
  return createClient(readRuntimeValue("SUPABASE_URL"), readRuntimeValue("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
