import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import type { PoolConfig } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/postgres?schema=public";
const requiresSsl = connectionString.includes("sslmode=require") || connectionString.includes("supabase.com");
const adapterConnectionString = connectionString
  .replace("?sslmode=require&", "?")
  .replace("&sslmode=require", "")
  .replace("?sslmode=require", "");
const poolConfig: PoolConfig = {
  connectionString: adapterConnectionString,
  ...(requiresSsl ? { ssl: { rejectUnauthorized: false } } : {}),
};

const adapter = new PrismaPg(poolConfig);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
