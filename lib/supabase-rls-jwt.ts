import { readRuntimeValue } from "@/lib/env";
import type { SessionUser } from "@/lib/types";

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]!);
  }
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacSha256(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return new Uint8Array(signature);
}

export async function createSupabaseRlsJwt(user: SessionUser): Promise<string> {
  const secret = readRuntimeValue("SUPABASE_JWT_SECRET");
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: "HS256",
    typ: "JWT",
  };
  const payload = {
    sub: user.id,
    role: "authenticated",
    app_role: user.role,
    app_store_id: user.storeId,
    iat: now,
    exp: now + 60 * 15,
  };

  const headerB64 = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsigned = `${headerB64}.${payloadB64}`;
  const sig = await hmacSha256(secret, unsigned);
  const sigB64 = bytesToBase64Url(sig);
  return `${unsigned}.${sigB64}`;
}
