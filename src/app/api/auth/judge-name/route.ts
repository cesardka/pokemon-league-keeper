import { NextRequest, NextResponse } from "next/server";
import { getSession, updateJudgeName } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { judgeName } = await request.json();

    if (!judgeName || typeof judgeName !== "string" || !judgeName.trim()) {
      return NextResponse.json(
        { error: "Judge name is required" },
        { status: 400 }
      );
    }

    await updateJudgeName(judgeName.trim());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Judge name error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
