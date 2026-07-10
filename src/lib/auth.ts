import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import type { SessionUser, UserRole } from "@/types"; // Use UserRole from types, it's the source of truth

// C5: Hapus fallback default; gagalkan startup bila JWT_SECRET kosong.
const raw = process.env.JWT_SECRET;
if (!raw) {
  throw new Error("JWT_SECRET wajib di-set di environment variables.");
}
const SECRET = new TextEncoder().encode(raw);

export type { SessionUser } from "@/types"; // SessionUser should also come from types for consistency
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
    console.error("JWT verification failed:", error); // Log error for debugging
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

// C2: Tambah guard otorisasi helper
export async function requireRole(
  requiredRoles: UserRole | UserRole[],
): Promise<SessionUser> {
  const session = await getSession();

  if (!session) {
    // Audit M15: Jangan menelan error senyap
    console.error("UNAUTHORIZED: No active session.");
    throw new Error("UNAUTHORIZED: No active session.");
  }

  const rolesArray = Array.isArray(requiredRoles)
    ? requiredRoles
    : [requiredRoles];

  if (!rolesArray.includes(session.role)) {
    // Audit M15: Jangan menelan error senyap
    console.error(
      `FORBIDDEN: User role '${session.role}' not in required roles: ${rolesArray.join(", ")}.`,
    );
    throw new Error(
      `FORBIDDEN: User role '${session.role}' not in required roles: ${rolesArray.join(", ")}.`,
    );
  }

  return session;
}

