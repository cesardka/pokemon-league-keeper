import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Pass it inline or via .env before running the seed.",
    );
  }

  // Use the standard pg driver for seeding (runs on Node locally/in CI).
  // Neon accepts regular pg connections over SSL, so no serverless adapter
  // is needed here — avoids flaky connection-string plumbing in
  // @neondatabase/serverless' pool-to-client handoff.
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(
    pool as unknown as ConstructorParameters<typeof PrismaPg>[0],
  );
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

async function main() {
  // Skip seeding in production
  if (process.env.NODE_ENV === "production") {
    console.log("⏭️  Skipping seed in production environment");
    return;
  }
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

  // Load-test event with 1000 barcodes for /queue performance testing
  const LOAD_TEST_EVENT_ID = "load-test-event-1k";
  const LOAD_TEST_BARCODE_COUNT = 1000;

  const loadTestEvent = await prisma.event.upsert({
    where: { id: LOAD_TEST_EVENT_ID },
    update: {},
    create: {
      id: LOAD_TEST_EVENT_ID,
      storeId: store.id,
      name: `Load Test Tournament (${LOAD_TEST_BARCODE_COUNT} slips)`,
      game: "Pokemon TCG",
      date: new Date(),
      status: "ACTIVE",
    },
  });

  const loadTestRound = await prisma.round.upsert({
    where: {
      eventId_roundNumber: {
        eventId: loadTestEvent.id,
        roundNumber: 1,
      },
    },
    update: {},
    create: {
      eventId: loadTestEvent.id,
      roundNumber: 1,
    },
  });

  const existingLoadTestBarcodes = await prisma.barcode.count({
    where: { eventId: loadTestEvent.id },
  });

  if (existingLoadTestBarcodes < LOAD_TEST_BARCODE_COUNT) {
    const judges = ["Judge Fernanda", "Judge Cesar", "Judge Alex", "Judge Sam"];
    const prefixes = ["PKM", "TCG", "PTL", "MTG", "EVT", "SLP", "QNX", "ZRB"];
    const alphanum = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
    // Deterministic PRNG so re-seeding produces the same values
    let rngState = 0x6d2b79f5;
    const rand = () => {
      rngState = (rngState + 0x6d2b79f5) | 0;
      let t = rngState;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const randomChunk = (len: number) =>
      Array.from(
        { length: len },
        () => alphanum[Math.floor(rand() * alphanum.length)],
      ).join("");

    const usedValues = new Set<string>();
    const now = Date.now();
    const toCreate = Array.from(
      { length: LOAD_TEST_BARCODE_COUNT - existingLoadTestBarcodes },
      (_, i) => {
        const index = existingLoadTestBarcodes + i;
        // Mix prefix, variable body length, and varied char set so each
        // barcode produces a visually distinct Code128 pattern.
        const prefix = prefixes[Math.floor(rand() * prefixes.length)];
        const bodyLen = 6 + Math.floor(rand() * 5); // 6–10 chars
        let value: string;
        do {
          value = `${prefix}-${randomChunk(bodyLen)}`;
        } while (usedValues.has(value));
        usedValues.add(value);

        return {
          eventId: loadTestEvent.id,
          roundId: loadTestRound.id,
          value,
          scannedBy: judges[index % judges.length],
          // Stagger timestamps: most recent first in ordering
          scannedAt: new Date(now - index * 1000),
        };
      },
    );

    // Insert in chunks to avoid hitting parameter limits
    const CHUNK_SIZE = 500;
    for (let i = 0; i < toCreate.length; i += CHUNK_SIZE) {
      await prisma.barcode.createMany({
        data: toCreate.slice(i, i + CHUNK_SIZE),
        skipDuplicates: true,
      });
    }

    console.log(
      `Created ${toCreate.length} load-test barcodes for event "${loadTestEvent.name}"`,
    );
  } else {
    console.log(
      `Load-test event already has ${existingLoadTestBarcodes} barcodes, skipping`,
    );
  }

  console.log("\n✅ Seed completed successfully!");
  console.log("Event code to login: 1234");
  console.log(`Load-test event id: ${LOAD_TEST_EVENT_ID}`);
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
