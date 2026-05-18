import type { Role, SessionUser } from "@/lib/types";
import { readRuntimeValue } from "@/lib/env";

const PREFIX = "v1";

function assertRole(value: unknown): value is Role {
  return value === "admin" || value === "store" || value === "store_all";
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i]! ^ b[i]!;
  }
  return diff === 0;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]!);
  }
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(s: string): Uint8Array | null {
  try {
    const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      out[i] = bin.charCodeAt(i)!;
    }
    return out;
  } catch {
    return null;
  }
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

async function hmacSha256(secret: string, data: Uint8Array): Promise<Uint8Array> {
  const key = await importHmacKey(secret);
  const buf = await crypto.subtle.sign("HMAC", key, new Uint8Array(data) as BufferSource);
  return new Uint8Array(buf);
}

function parseSessionUser(raw: unknown): SessionUser | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;
  if (
    typeof o.id !== "string" ||
    typeof o.name !== "string" ||
    typeof o.email !== "string" ||
    typeof o.role !== "string" ||
    !assertRole(o.role) ||
    !(o.storeId === null || typeof o.storeId === "string")
  ) {
    return null;
  }
  return {
    id: o.id,
    name: o.name,
    email: o.email,
    role: o.role,
    storeId: o.storeId,
  };
}

export async function sealSession(user: SessionUser): Promise<string> {
  const secret = readRuntimeValue("SESSION_SECRET");
  const payloadJson = JSON.stringify(user);
  const payloadBytes = new TextEncoder().encode(payloadJson);
  const payloadB64 = bytesToBase64Url(payloadBytes);
  const macInput = new TextEncoder().encode(`${PREFIX}.${payloadB64}`);
  const sigBytes = await hmacSha256(secret, macInput);
  const sigB64 = bytesToBase64Url(sigBytes);
  return `${PREFIX}.${payloadB64}.${sigB64}`;
}

export async function unsealSession(token: string): Promise<SessionUser | null> {
  try {
    const secret = readRuntimeValue("SESSION_SECRET");
    const parts = token.split(".");
    if (parts.length !== 3 || parts[0] !== PREFIX) {
      return null;
    }
    const payloadB64 = parts[1]!;
    const sigB64 = parts[2]!;
    const payloadBytes = base64UrlToBytes(payloadB64);
    const sigBytes = base64UrlToBytes(sigB64);
    if (!payloadBytes || !sigBytes) {
      return null;
    }
    const macInput = new TextEncoder().encode(`${PREFIX}.${payloadB64}`);
    const expectedSig = await hmacSha256(secret, macInput);
    if (!timingSafeEqual(sigBytes, expectedSig)) {
      return null;
    }
    const json = new TextDecoder().decode(payloadBytes);
    const parsed: unknown = JSON.parse(json);
    return parseSessionUser(parsed);
  } catch {
    return null;
  }
}
