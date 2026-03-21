import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import type { EventWithCounts } from "@/lib/types";

export default async function DashboardPage() {
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

  const activeEvents = events.filter((e: EventWithCounts) => e.status === "ACTIVE");
  const pastEvents = events.filter((e: EventWithCounts) => e.status === "COMPLETED");

  return (
    <div className="flex flex-col flex-1 bg-gray-50">
      <div className="flex flex-col flex-1 w-full max-w-2xl mx-auto">
        <header className="bg-white border-b">
          <div className="flex items-stretch justify-between">
            <div className="px-4 py-3">
              <h1 className="font-semibold text-gray-900">{session.storeName}</h1>
              <p className="text-sm text-gray-500">Tournament Manager</p>
            </div>
            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 p-4 space-y-6">
        <div className="grid gap-4">
          <Link
            href="/manager"
            className="group relative flex items-center justify-center h-64 bg-blue-600 hover:bg-blue-700 text-white text-2xl text-shadow-lg font-bold rounded-2xl shadow-lg transition-colors overflow-hidden"
          >
            <div
              className="absolute top-0 inset-0 bg-cover bg-center opacity-5 pointer-events-none transition-transform duration-200 group-hover:scale-110"
              style={{ backgroundImage: "url('/art/bills-transfer-sv35-art.webp')" }}
            />
            <span className="relative z-10">EVENT MANAGER</span>
          </Link>

          <Link
            href="/judge"
            className="group relative flex items-center justify-center h-64 bg-green-600 hover:bg-green-700 text-white text-2xl text-shadow-lg font-bold rounded-2xl shadow-lg transition-colors overflow-hidden"
          >
            <div
              className="absolute top-0 inset-0 bg-cover bg-center opacity-5 pointer-events-none transition-transform duration-200 group-hover:scale-110"
              style={{ backgroundImage: "url('/art/judge-sv10-art.webp')" }}
            />
            <span className="relative z-10">FLOOR JUDGE</span>
          </Link>
        </div>

        {activeEvents.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Active Events
            </h2>
            <div className="space-y-2">
              {activeEvents.map((event: EventWithCounts) => (
                <div
                  key={event.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-green-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{event.name}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(event.date).toLocaleDateString()} •{" "}
                        {event._count.rounds} rounds •{" "}
                        {event._count.barcodes} scans
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {pastEvents.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Past Events
            </h2>
            <div className="space-y-2">
              {pastEvents.map((event: EventWithCounts) => (
                <div
                  key={event.id}
                  className="bg-white rounded-xl p-4 shadow-sm border"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{event.name}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(event.date).toLocaleDateString()} •{" "}
                        {event._count.barcodes} scans
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                      Completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {events.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No events yet</p>
          </div>
        )}
        </main>
      </div>
    </div>
  );
}
