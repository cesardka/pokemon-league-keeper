import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.judgeName) {
      return NextResponse.json(
        { error: "Judge name not set" },
        { status: 400 }
      );
    }

    const { eventId, roundId, value } = await request.json();

    if (!eventId || !value) {
      return NextResponse.json(
        { error: "Event ID and barcode value are required" },
        { status: 400 }
      );
    }

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        storeId: session.storeId,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.status === "COMPLETED") {
      return NextResponse.json(
        { error: "This event has been finished and is no longer accepting scans" },
        { status: 403 }
      );
    }

    // Check for duplicate barcode in the same round
    if (roundId) {
      const existing = await prisma.barcode.findUnique({
        where: {
          roundId_value: {
            roundId,
            value,
          },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "This barcode was already scanned in this round" },
          { status: 409 }
        );
      }
    }

    const barcode = await prisma.barcode.create({
      data: {
        eventId,
        roundId: roundId || null,
        value,
        scannedBy: session.judgeName,
      },
    });

    return NextResponse.json({
      success: true,
      barcode: {
        id: barcode.id,
        value: barcode.value,
        scannedAt: barcode.scannedAt.toISOString(),
        scannedBy: barcode.scannedBy,
      },
    });
  } catch (error) {
    console.error("Barcode submit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
