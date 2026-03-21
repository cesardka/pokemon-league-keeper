import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import type { EventWithCounts } from "@/lib/types";

export default async function JudgeSelectPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  if (!session.judgeName) {
    redirect("/judge");
  }

  const events = (await prisma.event.findMany({
    where: {
      storeId: session.storeId,
      status: "ACTIVE",
    },
    orderBy: { date: "desc" },
    include: {
      _count: {
        select: { barcodes: true, rounds: true },
      },
    },
  })) as EventWithCounts[];

  return (
    <div className="flex flex-col flex-1 bg-gray-50">
      <div className="flex flex-col flex-1 w-full max-w-2xl mx-auto">
        <header className="bg-green-600 text-white">
          <div className="flex items-stretch gap-3">
            <BackButton href="/dashboard" variant="green" />
            <div className="py-3">
              <h1 className="font-semibold">Floor Judge</h1>
              <p className="text-sm text-green-200">Hi, {session.judgeName}!</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Select Event to Scan
          </h2>

          {events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event: EventWithCounts) => (
                <Link
                  key={event.id}
                  href={`/judge/${event.id}`}
                  className="block bg-white rounded-xl p-4 shadow-sm border border-green-200 hover:border-green-400 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{event.name}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(event.date).toLocaleDateString()} •{" "}
                        {event._count.rounds} rounds
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                      Scan →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No active events available</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
