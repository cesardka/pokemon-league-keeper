import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JudgeScannerView } from "@/components/JudgeScannerView";

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
        <JudgeScannerView
          eventId={eventId}
          eventName={event.name}
          judgeName={session.judgeName}
          rounds={event.rounds.map((r: { id: string; roundNumber: number }) => ({
            id: r.id,
            roundNumber: r.roundNumber,
          }))}
        />
      </div>
    </div>
  );
}
