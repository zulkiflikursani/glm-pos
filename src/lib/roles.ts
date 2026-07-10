import type { UserRole } from "@/types";

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  KASIR: "Kasir",
  PELAYAN: "Pelayan",
  DAPUR: "Dapur",
};

export function canAccessRoute(pathname: string, role: UserRole): boolean {
  if (pathname.startsWith("/admin")) return role === "ADMIN";
  if (pathname.startsWith("/dashboard")) {
    return role === "ADMIN" || role === "KASIR";
  }
  if (pathname.startsWith("/kitchen")) {
    return role === "ADMIN" || role === "DAPUR" || role === "PELAYAN";
  }
  if (pathname.startsWith("/tables")) {
    return role === "ADMIN" || role === "KASIR" || role === "PELAYAN";
  }
  return (
    role === "ADMIN" ||
    role === "KASIR" ||
    role === "PELAYAN" ||
    role === "DAPUR"
  );
}

export type SessionUser = {
  userId: string;
  username: string;
  name: string;
  role: UserRole;
};
