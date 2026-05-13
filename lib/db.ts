import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Client, QueryResult, QueryResultRow } from "pg";

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
  const client = new Client({
    connectionString: url,
    connectionTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    return await client.query<T>(text, params);
  } finally {
    await client.end().catch(() => undefined);
  }
}
