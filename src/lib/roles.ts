import type { UserRole } from "@prisma/client";

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  KASIR: "Kasir",
  PELAYAN: "Pelayan",
};

export function canAccessRoute(pathname: string, role: UserRole): boolean {
  if (pathname.startsWith("/admin")) return role === "ADMIN";
  if (pathname.startsWith("/dashboard")) {
    return role === "ADMIN" || role === "KASIR";
  }
  if (pathname.startsWith("/kitchen")) {
    return role === "ADMIN" || role === "KASIR";
  }
  return role === "ADMIN" || role === "KASIR" || role === "PELAYAN";
}

export type SessionUser = {
  userId: string;
  username: string;
  name: string;
  role: UserRole;
};
