import { Pool } from "pg";

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

export const db =
  globalForDb.pool ??
  new Pool({
    connectionString:
      process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/mega_sports?schema=public",
    max: 4,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = db;
}
