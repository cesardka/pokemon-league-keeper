import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    const { eventId } = await params;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        storeId: session.storeId,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const barcodes = await prisma.barcode.findMany({
      where: {
        eventId,
        ...(since && {
          scannedAt: {
            gt: new Date(since),
          },
        }),
      },
      orderBy: { scannedAt: "desc" },
      take: 50,
    });

    return NextResponse.json(
      barcodes.map((b: { id: string; value: string; scannedAt: Date; scannedBy: string; roundId: string | null }) => ({
        id: b.id,
        value: b.value,
        scannedAt: b.scannedAt.toISOString(),
        scannedBy: b.scannedBy,
        roundId: b.roundId,
      }))
    );
  } catch (error) {
    console.error("Barcodes fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
