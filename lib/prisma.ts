import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import type { PoolConfig } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaClient: PrismaClient | undefined;

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  try {
    const { env } = getCloudflareContext();
    const value = (env as Record<string, string | undefined>).DATABASE_URL;
    if (value) {
      return value;
    }
  } catch {
    // Not running inside the Cloudflare runtime.
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL is not configured in runtime environment.");
  }

  return "postgresql://postgres:postgres@localhost:5432/postgres?schema=public";
}

function createPrismaClient(): PrismaClient {
  const connectionString = resolveDatabaseUrl();
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
  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma ??= createPrismaClient();
    return globalForPrisma.prisma;
  }

  prismaClient ??= createPrismaClient();
  return prismaClient;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getPrismaClient(), prop, receiver);
    return typeof value === "function" ? value.bind(getPrismaClient()) : value;
  },
});
