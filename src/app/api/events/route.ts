import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Event name is required" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        name: name.trim(),
        storeId: session.storeId,
        date: new Date(),
        status: "ACTIVE",
        rounds: {
          create: {
            roundNumber: 1,
          },
        },
      },
      include: {
        rounds: true,
      },
    });

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        name: event.name,
        date: event.date.toISOString(),
        status: event.status,
      },
    });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
