import { NextResponse } from "next/server";
import { ensureMvpSession } from "@/lib/auth";

// MVP: Auto-login and redirect to dashboard.
// Implemented as a Route Handler because Server Components
// cannot set cookies (Next.js restriction).
export async function GET(request: Request) {
  await ensureMvpSession();
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
