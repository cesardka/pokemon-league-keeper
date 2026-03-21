import { PrismaClient } from "@prisma/client";
import { neonConfig, Pool as NeonPool } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import ws from "ws";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function isNeonUrl(url: string | undefined): boolean {
  return !!url?.includes("neon.tech");
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  if (isNeonUrl(databaseUrl)) {
    neonConfig.webSocketConstructor = ws;
    const pool = new NeonPool({ connectionString: databaseUrl });
    const adapter = new PrismaNeon(
      pool as unknown as ConstructorParameters<typeof PrismaNeon>[0],
    );
    return new PrismaClient({ adapter });
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(
    pool as unknown as ConstructorParameters<typeof PrismaPg>[0],
  );
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
