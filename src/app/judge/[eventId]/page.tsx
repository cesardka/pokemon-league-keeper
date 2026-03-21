import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { BarcodeScanner } from "@/components/BarcodeScanner";

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function JudgeScanPage({ params }: PageProps) {
  const session = await getSession();
  const { eventId } = await params;

  if (!session) {
    redirect("/");
  }

  if (!session.judgeName) {
    redirect("/judge");
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

  return (
    <div className="flex flex-col flex-1 bg-gray-50">
      <div className="flex flex-col flex-1 w-full max-w-2xl mx-auto">
        <header className="bg-green-600 text-white pr-4">
          <div className="flex items-center justify-between">
            <div className="flex items-stretch gap-3">
              <BackButton href="/judge/select" variant="green" />
              <div className="py-3">
                <h1 className="font-semibold">{event.name}</h1>
                <p className="text-sm text-green-200">{session.judgeName}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col">
          <BarcodeScanner
            eventId={eventId}
            rounds={event.rounds.map((r: { id: string; roundNumber: number }) => ({
              id: r.id,
              roundNumber: r.roundNumber,
            }))}
          />
        </main>
      </div>
    </div>
  );
}
