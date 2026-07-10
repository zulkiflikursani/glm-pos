"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import type {
  AdminCategory,
  AdminIngredient,
  AdminProduct,
  AdminRecipe,
  AdminUser,
  CategoryFormInput,
  IngredientFormInput,
  ProductFormInput,
  RecipeFormInput,
  UserFormInput,
  UserRole,
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
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      isActive: true,
    },
    orderBy: { name: "asc" },
  });
  return users as AdminUser[];
}

export async function createProduct(
  input: ProductFormInput,
): Promise<ActionResult> {
  const name = input.name.trim();
  if (!name) return { success: false, error: "Nama produk wajib diisi." };
  if (input.price <= 0)
    return { success: false, error: "Harga harus lebih dari 0." };

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
  if (input.price <= 0)
    return { success: false, error: "Harga harus lebih dari 0." };

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
  const productCount = await prisma.product.count({
    where: { categoryId: id },
  });
  if (productCount > 0) {
    return {
      success: false,
      error:
        "Kategori masih memiliki produk. Pindahkan atau hapus produk terlebih dahulu.",
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

// ---------------------------------------------------------------------------
// Bahan Mentah (Ingredient) & Resep (Recipe) — Manajemen Stok (Fase 4 PRD)
// ---------------------------------------------------------------------------

export async function getAdminIngredients(): Promise<AdminIngredient[]> {
  return prisma.ingredient.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      unit: true,
      stock: true,
      unitCost: true,
      isActive: true,
    },
  });
}

export async function createIngredient(
  input: IngredientFormInput,
): Promise<ActionResult> {
  const name = input.name.trim();
  if (!name) return { success: false, error: "Nama bahan wajib diisi." };
  const unit = input.unit.trim();
  if (!unit)
    return {
      success: false,
      error: "Satuan wajib diisi (kg, liter, butir, dll).",
    };

  try {
    await prisma.ingredient.create({
      data: {
        name,
        unit,
        stock: input.stock ?? 0,
        unitCost: input.unitCost ?? 0,
        isActive: input.isActive ?? true,
      },
    });
    revalidateAll();
    return { success: true };
  } catch {
    return { success: false, error: "Bahan sudah ada atau gagal disimpan." };
  }
}

export async function updateIngredient(
  id: string,
  input: IngredientFormInput,
): Promise<ActionResult> {
  const name = input.name.trim();
  if (!name) return { success: false, error: "Nama bahan wajib diisi." };
  const unit = input.unit.trim();
  if (!unit) return { success: false, error: "Satuan wajib diisi." };

  try {
    await prisma.ingredient.update({
      where: { id },
      data: {
        name,
        unit,
        stock: input.stock ?? 0,
        unitCost: input.unitCost ?? 0,
        isActive: input.isActive ?? true,
      },
    });
    revalidateAll();
    return { success: true };
  } catch {
    return { success: false, error: "Gagal memperbarui bahan." };
  }
}

export async function deleteIngredient(id: string): Promise<ActionResult> {
  const usage = await prisma.recipeItem.count({
    where: { ingredientId: id },
  });
  if (usage > 0) {
    return {
      success: false,
      error:
        "Bahan masih dipakai dalam resep. Hapus dari resep terlebih dahulu.",
    };
  }

  try {
    await prisma.ingredient.update({
      where: { id },
      data: { isActive: false },
    });
    revalidateAll();
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menonaktifkan bahan." };
  }
}

export async function getAdminRecipes(): Promise<AdminRecipe[]> {
  const recipes = await prisma.recipe.findMany({
    include: {
      product: { select: { id: true, name: true } },
      items: {
        include: {
          ingredient: {
            select: { id: true, name: true, unit: true, unitCost: true },
          },
        },
        orderBy: { ingredient: { name: "asc" } },
      },
    },
    orderBy: { product: { name: "asc" } },
  });

  return recipes.map((recipe) => ({
    id: recipe.id,
    productId: recipe.product.id,
    productName: recipe.product.name,
    items: recipe.items.map((item) => ({
      id: item.id,
      ingredientId: item.ingredientId,
      ingredientName: item.ingredient.name,
      unit: item.ingredient.unit,
      quantity: item.quantity,
    })),
    cost: recipe.items.reduce(
      (sum, item) => sum + item.ingredient.unitCost * item.quantity,
      0,
    ),
  }));
}

/** Hitung HPP sebuah produk berdasarkan resepnya (0 jika tidak punya resep). */
export async function getProductCost(productId: string): Promise<number> {
  const recipe = await prisma.recipe.findUnique({
    where: { productId },
    include: {
      items: { include: { ingredient: { select: { unitCost: true } } } },
    },
  });
  if (!recipe) return 0;
  return recipe.items.reduce(
    (sum, item) => sum + item.ingredient.unitCost * item.quantity,
    0,
  );
}

export async function saveRecipe(
  input: RecipeFormInput,
): Promise<ActionResult> {
  // Bersihkan item: skip qty <= 0
  const items = input.items.filter((i) => i.quantity > 0);
  if (!items.length) {
    return {
      success: false,
      error: "Resep minimal harus memiliki 1 bahan dengan jumlah > 0.",
    };
  }

  // Pastikan bahan yang dipakai masih ada & aktif, dan stok cukup tidak diperiksa di sini.
  const ingredientIds = items.map((i) => i.ingredientId);
  const existing = await prisma.ingredient.findMany({
    where: { id: { in: ingredientIds } },
    select: { id: true },
  });
  if (existing.length !== ingredientIds.length) {
    return { success: false, error: "Salah satu bahan tidak ditemukan." };
  }

  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { id: true },
  });
  if (!product) {
    return { success: false, error: "Produk tidak ditemukan." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // upsert resep (1:1 dengan produk)
      const recipe = await tx.recipe.upsert({
        where: { productId: input.productId },
        update: {},
        create: { productId: input.productId },
      });

      // ganti seluruh item resep
      await tx.recipeItem.deleteMany({ where: { recipeId: recipe.id } });
      await tx.recipeItem.createMany({
        data: items.map((item) => ({
          recipeId: recipe.id,
          ingredientId: item.ingredientId,
          quantity: item.quantity,
        })),
      });
    });

    revalidateAll();
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menyimpan resep." };
  }
}

export async function deleteRecipe(productId: string): Promise<ActionResult> {
  try {
    await prisma.recipe.deleteMany({ where: { productId } });
    revalidateAll();
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menghapus resep." };
  }
}
