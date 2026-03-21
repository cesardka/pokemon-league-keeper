import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function isNeonUrl(url: string | undefined): boolean {
  return !!url?.includes("neon.tech");
}

function createPrismaClient(): PrismaClient {
  console.log({
    DATABASE_URL: process.env.DATABASE_URL,
    isNeonUrl: isNeonUrl(process.env.DATABASE_URL),
  });

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  if (isNeonUrl(databaseUrl)) {
    const adapter = new PrismaNeon({ connectionString: databaseUrl });
    return new PrismaClient({ adapter });
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(
    pool as unknown as ConstructorParameters<typeof PrismaPg>[0],
  );
  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = client[prop as keyof PrismaClient];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
