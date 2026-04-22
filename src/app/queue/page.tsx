import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import type { EventWithCounts } from "@/lib/types";
import { CreateEventForm } from "@/components/CreateEventForm";

export default async function ManagerSelectPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const events = (await prisma.event.findMany({
    where: { storeId: session.storeId },
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
        <header className="bg-blue-600 text-white">
          <div className="flex items-stretch gap-3">
            <BackButton href="/dashboard" variant="blue" />
            <div className="py-3">
              <h1 className="font-semibold">Send to TOM</h1>
              <p className="text-sm text-blue-200">Select an event</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 space-y-4">
          <CreateEventForm />

          {events.length > 0 && (
            <div className="space-y-3">
              {events.map((event: EventWithCounts) => (
                <Link
                  key={event.id}
                  href={`/queue/${event.id}`}
                  className="block bg-white rounded-xl p-4 shadow-sm border hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {event.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(event.date).toLocaleDateString()} •{" "}
                        {event._count.rounds} rounds
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {event._count.barcodes}
                      </p>
                      <p className="text-xs text-gray-500">scans</p>
                    </div>
                  </div>
                  {event.status === "ACTIVE" && (
                    <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Active
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
