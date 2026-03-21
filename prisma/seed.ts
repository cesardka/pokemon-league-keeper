import { PrismaClient } from "@prisma/client";
import { neonConfig, Pool as NeonPool } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import ws from "ws";
import "dotenv/config";

function isNeonUrl(url: string | undefined): boolean {
  return !!url?.includes("neon.tech");
}

function createPrismaClient(): PrismaClient {
  console.log({
    DATABASE_URL: process.env.DATABASE_URL,
    isNeonUrl: isNeonUrl(process.env.DATABASE_URL),
  })

  if (isNeonUrl(process.env.DATABASE_URL)) {
    neonConfig.webSocketConstructor = ws;
    const pool = new NeonPool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaNeon(pool as unknown as ConstructorParameters<typeof PrismaNeon>[0]);
    return new PrismaClient({ adapter });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool as unknown as ConstructorParameters<typeof PrismaPg>[0]);
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

async function main() {
  // Create a sample store
  const store = await prisma.store.upsert({
    where: { eventCode: "1234" },
    update: {},
    create: {
      name: "Nerdz Cards",
      location: "Porto Alegre, RS",
      country: "Brazil",
      eventCode: "1234",
    },
  });

  console.log("Created store:", store.name);

  // Create a sample event
  const event = await prisma.event.upsert({
    where: { id: "nerdz-cards-event-1" },
    update: {},
    create: {
      id: "nerdz-cards-event-1",
      storeId: store.id,
      name: "Weekly Pokemon TCG Tournament",
      game: "Pokemon TCG",
      date: new Date(),
      status: "ACTIVE",
    },
  });

  console.log("Created event:", event.name);

  // Create sample rounds
  const round1 = await prisma.round.upsert({
    where: {
      eventId_roundNumber: {
        eventId: event.id,
        roundNumber: 1,
      },
    },
    update: {},
    create: {
      eventId: event.id,
      roundNumber: 1,
    },
  });

  const round2 = await prisma.round.upsert({
    where: {
      eventId_roundNumber: {
        eventId: event.id,
        roundNumber: 2,
      },
    },
    update: {},
    create: {
      eventId: event.id,
      roundNumber: 2,
    },
  });

  console.log("Created rounds:", round1.roundNumber, round2.roundNumber);

  // Create some sample barcodes
  await prisma.barcode.createMany({
    data: [
      {
        eventId: event.id,
        roundId: round1.id,
        value: "PKM001234567",
        scannedBy: "Judge Fernanda",
        scannedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      },
      {
        eventId: event.id,
        roundId: round1.id,
        value: "PKM007654321",
        scannedBy: "Judge Cesar",
        scannedAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      },
    ],
    skipDuplicates: true,
  });

  console.log("Created sample barcodes");
  console.log("\n✅ Seed completed successfully!");
  console.log("Event code to login: 1234");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
