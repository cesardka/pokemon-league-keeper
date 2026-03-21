import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getSession();
    const { eventId } = await params;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        storeId: session.storeId,
      },
      include: {
        rounds: {
          orderBy: { roundNumber: "desc" },
          take: 1,
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot add rounds to a finished event" },
        { status: 403 }
      );
    }

    const nextRoundNumber = (event.rounds[0]?.roundNumber ?? 0) + 1;

    const round = await prisma.round.create({
      data: {
        eventId,
        roundNumber: nextRoundNumber,
      },
    });

    return NextResponse.json({
      success: true,
      round: {
        id: round.id,
        roundNumber: round.roundNumber,
      },
    });
  } catch (error) {
    console.error("Create round error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
