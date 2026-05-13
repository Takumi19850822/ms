const HASH_ALGORITHM = "PBKDF2";
const DIGEST_ALGORITHM = "SHA-256";
const HASH_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function derivePasswordKey(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), HASH_ALGORITHM, false, [
    "deriveBits",
  ]);
  const saltBuffer = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer;
  const bits = await crypto.subtle.deriveBits(
    {
      name: HASH_ALGORITHM,
      hash: DIGEST_ALGORITHM,
      salt: saltBuffer,
      iterations,
    },
    keyMaterial,
    KEY_BITS,
  );
  return new Uint8Array(bits);
}

function secureEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derivePasswordKey(password, salt, HASH_ITERATIONS);
  return `pbkdf2-sha256$${HASH_ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(hash)}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, iterationsRaw, saltRaw, hashRaw] = storedHash.split("$");
  if (algorithm !== "pbkdf2-sha256" || !iterationsRaw || !saltRaw || !hashRaw) {
    return false;
  }
  const iterations = Number(iterationsRaw);
  if (!Number.isInteger(iterations) || iterations <= 0) {
    return false;
  }
  const salt = fromBase64Url(saltRaw);
  const expected = fromBase64Url(hashRaw);
  const actual = await derivePasswordKey(password, salt, iterations);
  return secureEqual(actual, expected);
}
