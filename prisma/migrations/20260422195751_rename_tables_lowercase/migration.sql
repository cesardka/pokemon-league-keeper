/*
  Warnings:

  - You are about to drop the `Barcode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Event` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Match` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Participant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Round` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Store` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Barcode" DROP CONSTRAINT "Barcode_eventId_fkey";

-- DropForeignKey
ALTER TABLE "Barcode" DROP CONSTRAINT "Barcode_roundId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_storeId_fkey";

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_participant1Id_fkey";

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_participant2Id_fkey";

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_roundId_fkey";

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_winnerId_fkey";

-- DropForeignKey
ALTER TABLE "Round" DROP CONSTRAINT "Round_eventId_fkey";

-- DropTable
DROP TABLE "Barcode";

-- DropTable
DROP TABLE "Event";

-- DropTable
DROP TABLE "Match";

-- DropTable
DROP TABLE "Participant";

-- DropTable
DROP TABLE "Round";

-- DropTable
DROP TABLE "Store";

-- CreateTable
CREATE TABLE "store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "country" TEXT,
    "eventCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "game" TEXT NOT NULL DEFAULT 'Pokemon TCG',
    "date" TIMESTAMP(3) NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "round" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pokemonId" TEXT,
    "birthDate" TIMESTAMP(3),
    "category" "Category" NOT NULL DEFAULT 'MASTER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "participant1Id" TEXT,
    "participant2Id" TEXT,
    "winnerId" TEXT,
    "result" "MatchResult" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barcode" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "roundId" TEXT,
    "value" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scannedBy" TEXT NOT NULL,

    CONSTRAINT "barcode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_eventCode_key" ON "store"("eventCode");

-- CreateIndex
CREATE UNIQUE INDEX "round_eventId_roundNumber_key" ON "round"("eventId", "roundNumber");

-- CreateIndex
CREATE INDEX "barcode_eventId_scannedAt_idx" ON "barcode"("eventId", "scannedAt");

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round" ADD CONSTRAINT "round_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "match_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "match_participant1Id_fkey" FOREIGN KEY ("participant1Id") REFERENCES "participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "match_participant2Id_fkey" FOREIGN KEY ("participant2Id") REFERENCES "participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "match_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barcode" ADD CONSTRAINT "barcode_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barcode" ADD CONSTRAINT "barcode_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "round"("id") ON DELETE SET NULL ON UPDATE CASCADE;
