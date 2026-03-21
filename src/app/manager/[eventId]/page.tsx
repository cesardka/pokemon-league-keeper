import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BackButton } from "@/components/BackButton";
import { ManagerEventView } from "@/components/ManagerEventView";
import { FinishEventButton } from "@/components/FinishEventButton";

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function ManagerEventPage({ params }: PageProps) {
  const session = await getSession();
  const { eventId } = await params;

  if (!session) {
    redirect("/");
  }

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      storeId: session.storeId,
    },
    include: {
      rounds: {
        orderBy: { roundNumber: "asc" },
      },
    },
  });

  if (!event) {
    notFound();
  }

  const barcodes = await prisma.barcode.findMany({
    where: { eventId },
    orderBy: { scannedAt: "desc" },
    take: 50,
  });

  return (
    <div className="flex flex-col flex-1 bg-gray-50">
      <div className="flex flex-col flex-1 w-full max-w-2xl mx-auto">
        <header className="bg-blue-600 text-white pr-4">
          <div className="flex items-stretch justify-between">
            <div className="flex items-stretch gap-3">
              <BackButton href="/manager" variant="blue" />
              <div className="py-3">
                <h1 className="font-semibold">{event.name}</h1>
                <p className="text-sm text-blue-200">
                  {new Date(event.date).toLocaleDateString()} • {event.rounds.length} rounds
                  {event.status === "COMPLETED" && " • Finished"}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <FinishEventButton eventId={eventId} currentStatus={event.status} />
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col p-4">
          <ManagerEventView
            eventId={eventId}
            isEventCompleted={event.status === "COMPLETED"}
            rounds={event.rounds.map((r: { id: string; roundNumber: number }) => ({
              id: r.id,
              roundNumber: r.roundNumber,
            }))}
            initialBarcodes={barcodes.map((b: { id: string; value: string; scannedAt: Date; scannedBy: string; roundId: string | null }) => ({
              id: b.id,
              value: b.value,
              scannedAt: b.scannedAt.toISOString(),
              scannedBy: b.scannedBy,
              roundId: b.roundId,
            }))}
          />
        </main>
      </div>
    </div>
  );
}
