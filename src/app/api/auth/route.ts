import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { eventCode } = await request.json();

    if (!eventCode) {
      return NextResponse.json(
        { error: "Event code is required" },
        { status: 400 }
      );
    }

    const store = await prisma.store.findUnique({
      where: { eventCode },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Invalid event code" },
        { status: 401 }
      );
    }

    await setSession({
      storeId: store.id,
      storeName: store.name,
    });

    return NextResponse.json({
      success: true,
      store: {
        id: store.id,
        name: store.name,
      },
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
