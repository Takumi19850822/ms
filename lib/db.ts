import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Pool } from "pg";

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
  poolUrl: string | undefined;
};

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  try {
    const { env } = getCloudflareContext();
    const value = (env as Record<string, string | undefined>)?.DATABASE_URL;
    if (value) {
      return value;
    }
  } catch {
    // ignore outside Cloudflare runtime
  }
  throw new Error("DATABASE_URL is not configured in runtime environment.");
}

function normalizeDatabaseUrl(value: string): string {
  const url = new URL(value);
  url.searchParams.delete("sslmode");
  return url.toString();
}

export function getDb(): Pool {
  const url = normalizeDatabaseUrl(resolveDatabaseUrl());
  if (!globalForDb.pool || globalForDb.poolUrl !== url) {
    globalForDb.pool = new Pool({
      connectionString: url,
      max: 4,
      ssl: { rejectUnauthorized: false },
    });
    globalForDb.poolUrl = url;
  }
  return globalForDb.pool;
}
