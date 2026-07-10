"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

import { createSession, deleteSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types";

export async function login(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Username dan password wajib diisi." };
  }

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || !user.isActive) {
    return { error: "Username atau password salah." };
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return { error: "Username atau password salah." };
  }

  await createSession({
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role as UserRole,
  });

  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
