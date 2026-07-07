"use server";

import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import type {
  AdminCategory,
  AdminProduct,
  AdminUser,
  CategoryFormInput,
  ProductFormInput,
  UserFormInput,
} from "@/types";

type ActionResult = { success: true } | { success: false; error: string };

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/kitchen");
}

export async function getAdminProducts(): Promise<AdminProduct[]> {
  return prisma.product.findMany({
    include: {
      category: { select: { id: true, name: true } },
    },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });
}

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    productCount: category._count.products,
  }));
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      isActive: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function createProduct(
  input: ProductFormInput,
): Promise<ActionResult> {
  const name = input.name.trim();
  if (!name) return { success: false, error: "Nama produk wajib diisi." };
  if (input.price <= 0) return { success: false, error: "Harga harus lebih dari 0." };

  try {
    await prisma.product.create({
      data: {
        name,
        price: input.price,
        emoji: input.emoji?.trim() || null,
        categoryId: input.categoryId,
        isActive: input.isActive ?? true,
        stock: input.stock ?? 0,
        trackStock: input.trackStock ?? false,
      },
    });
    revalidateAll();
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menambah produk." };
  }
}

export async function updateProduct(
  id: string,
  input: ProductFormInput,
): Promise<ActionResult> {
  const name = input.name.trim();
  if (!name) return { success: false, error: "Nama produk wajib diisi." };
  if (input.price <= 0) return { success: false, error: "Harga harus lebih dari 0." };

  try {
    await prisma.product.update({
      where: { id },
      data: {
        name,
        price: input.price,
        emoji: input.emoji?.trim() || null,
        categoryId: input.categoryId,
        isActive: input.isActive ?? true,
        stock: input.stock ?? 0,
        trackStock: input.trackStock ?? false,
      },
    });
    revalidateAll();
    return { success: true };
  } catch {
    return { success: false, error: "Gagal memperbarui produk." };
  }
}

export async function adjustStock(
  id: string,
  stock: number,
): Promise<ActionResult> {
  if (stock < 0) return { success: false, error: "Stok tidak boleh negatif." };

  try {
    await prisma.product.update({
      where: { id },
      data: { stock, trackStock: true },
    });
    revalidateAll();
    return { success: true };
  } catch {
    return { success: false, error: "Gagal memperbarui stok." };
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
    revalidateAll();
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menonaktifkan produk." };
  }
}

export async function createCategory(
  input: CategoryFormInput,
): Promise<ActionResult> {
  const name = input.name.trim();
  if (!name) return { success: false, error: "Nama kategori wajib diisi." };

  try {
    await prisma.category.create({ data: { name } });
    revalidateAll();
    return { success: true };
  } catch {
    return { success: false, error: "Kategori sudah ada atau gagal disimpan." };
  }
}

export async function updateCategory(
  id: string,
  input: CategoryFormInput,
): Promise<ActionResult> {
  const name = input.name.trim();
  if (!name) return { success: false, error: "Nama kategori wajib diisi." };

  try {
    await prisma.category.update({
      where: { id },
      data: { name },
    });
    revalidateAll();
    return { success: true };
  } catch {
    return { success: false, error: "Gagal memperbarui kategori." };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    return {
      success: false,
      error: "Kategori masih memiliki produk. Pindahkan atau hapus produk terlebih dahulu.",
    };
  }

  try {
    await prisma.category.delete({ where: { id } });
    revalidateAll();
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menghapus kategori." };
  }
}

export async function createUser(input: UserFormInput): Promise<ActionResult> {
  const name = input.name.trim();
  const username = input.username.trim();
  if (!name || !username) {
    return { success: false, error: "Nama dan username wajib diisi." };
  }
  if (!input.password || input.password.length < 6) {
    return { success: false, error: "Password minimal 6 karakter." };
  }

  try {
    const hashed = await bcrypt.hash(input.password, 10);
    await prisma.user.create({
      data: {
        name,
        username,
        password: hashed,
        role: input.role,
        isActive: input.isActive ?? true,
      },
    });
    return { success: true };
  } catch {
    return { success: false, error: "Username sudah digunakan." };
  }
}

export async function updateUser(
  id: string,
  input: UserFormInput,
): Promise<ActionResult> {
  const name = input.name.trim();
  const username = input.username.trim();
  if (!name || !username) {
    return { success: false, error: "Nama dan username wajib diisi." };
  }

  try {
    const data: {
      name: string;
      username: string;
      role: UserRole;
      isActive: boolean;
      password?: string;
    } = {
      name,
      username,
      role: input.role,
      isActive: input.isActive ?? true,
    };

    if (input.password && input.password.length >= 6) {
      data.password = await bcrypt.hash(input.password, 10);
    }

    await prisma.user.update({ where: { id }, data });
    return { success: true };
  } catch {
    return { success: false, error: "Gagal memperbarui pengguna." };
  }
}

export async function deleteUser(id: string): Promise<ActionResult> {
  try {
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menonaktifkan pengguna." };
  }
}
