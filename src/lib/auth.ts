import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import type { SessionUser } from "@/lib/roles";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "glm-pos-dev-secret-change-in-production",
);

export type { SessionUser } from "@/lib/roles";
export { ROLE_LABELS, canAccessRoute } from "@/lib/roles";

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
