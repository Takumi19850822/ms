import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Pool, QueryResult, QueryResultRow } from "pg";

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
  url.searchParams.delete("pgbouncer");
  return url.toString();
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  const url = normalizeDatabaseUrl(resolveDatabaseUrl());
  const pool = new Pool({
    connectionString: url,
    max: 1,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 1000,
    allowExitOnIdle: true,
    ssl: { rejectUnauthorized: false },
  });

  try {
    return await pool.query<T>(text, params);
  } finally {
    await pool.end().catch(() => undefined);
  }
}
