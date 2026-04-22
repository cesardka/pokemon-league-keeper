import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SESSION_COOKIE = "tcg_session";

export interface Session {
  storeId: string;
  storeName: string;
  judgeName?: string;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  if (!sessionCookie) {
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value) as Session;

    // Validate that the store still exists in the database
    const store = await prisma.store.findUnique({
      where: { id: session.storeId },
    });

    if (!store) {
      // Store no longer exists, clear the invalid session
      cookieStore.delete(SESSION_COOKIE);
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function setSession(session: Session): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
}

export async function updateJudgeName(judgeName: string): Promise<void> {
  const session = await getSession();
  if (session) {
    await setSession({ ...session, judgeName });
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getOrCreateDefaultStore() {
  // For MVP: use first store or create one
  let store = await prisma.store.findFirst();

  if (!store) {
    store = await prisma.store.create({
      data: {
        name: "MVP Tournament",
        eventCode: "0000",
        location: "Default Location",
      },
    });
  }

  return store;
}

export async function ensureMvpSession(): Promise<Session> {
  const existingSession = await getSession();
  if (existingSession) {
    return existingSession;
  }

  const store = await getOrCreateDefaultStore();
  const session: Session = {
    storeId: store.id,
    storeName: store.name,
  };
  await setSession(session);
  return session;
}
