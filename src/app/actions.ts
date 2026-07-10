"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { broadcastEvent } from "@/lib/ws-notify";
import type {
  CategoryOption,
  CreateOrderInput,
  KitchenTicketView,
  KitchenTicketStatus,
  OrderResult,
  ProductWithCategory,
  TableOption,
} from "@/types";

export async function getCategories(): Promise<CategoryOption[]> {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function getTables(): Promise<TableOption[]> {
  return prisma.table.findMany({
    orderBy: { number: "asc" },
    select: { id: true, number: true, status: true },
  });
}

export async function getProducts(
  categoryId?: string,
  search?: string,
): Promise<ProductWithCategory[]> {
  const searchTerm = search?.trim();

  return prisma.product.findMany({
    where: {
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
      ...(searchTerm ? { name: { contains: searchTerm } } : {}),
    },
    include: {
      category: {
        select: { id: true, name: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getTaxRate(): Promise<number> {
  const setting = await prisma.setting.findUnique({
    where: { key: "tax_rate" },
  });

  const rate = setting ? parseFloat(setting.value) : 0.11;
  return Number.isFinite(rate) ? rate : 0.11;
}

function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toTimeString().slice(0, 8).replace(/:/g, "");
  const random = Math.floor(Math.random() * 900 + 100);
  return `ORD-${date}-${time}-${random}`;
}

function generateTicketNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toTimeString().slice(0, 8).replace(/:/g, "");
  const random = Math.floor(Math.random() * 900 + 100);
  return `KIT-${date}-${time}-${random}`;
}

export async function createOrder(
  input: CreateOrderInput,
): Promise<
  { success: true; order: OrderResult } | { success: false; error: string }
> {
  if (!input.items.length) {
    return { success: false, error: "Keranjang masih kosong." };
  }

  const session = await getSession();
  const taxRate = await getTaxRate();
  const subtotal = input.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax;

  if (input.paymentMethod === "CASH") {
    if (!input.cashReceived || input.cashReceived < total) {
      return {
        success: false,
        error: "Nominal tunai kurang dari total pembayaran.",
      };
    }
  }

  const productIds = input.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      stock: true,
      trackStock: true,
      recipe: {
        select: {
          items: {
            select: {
              quantity: true,
              ingredient: {
                select: { id: true, name: true, stock: true, unit: true },
              },
            },
          },
        },
      },
    },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Validasi stok produk jadi (trackStock)
  for (const item of input.items) {
    const product = productMap.get(item.productId);
    if (!product) {
      return {
        success: false,
        error: `Produk "${item.productName}" tidak ditemukan.`,
      };
    }
    if (product.trackStock && product.stock < item.quantity) {
      return {
        success: false,
        error: `Stok "${product.name}" tidak cukup (tersisa ${product.stock}).`,
      };
    }
  }

  // Hitung total kebutuhan tiap bahan mentah dari semua item order (berdasarkan resep)
  // dan validasi stok bahan mentah cukup.
  const ingredientNeeds = new Map<
    string,
    { name: string; unit: string; need: number; stock: number }
  >();
  for (const item of input.items) {
    const product = productMap.get(item.productId)!;
    const recipe = product.recipe;
    if (!recipe) continue; // produk tanpa resep → tidak deduksi bahan

    for (const ri of recipe.items) {
      const need = ri.quantity * item.quantity;
      const prev = ingredientNeeds.get(ri.ingredient.id);
      if (prev) {
        prev.need += need;
      } else {
        ingredientNeeds.set(ri.ingredient.id, {
          name: ri.ingredient.name,
          unit: ri.ingredient.unit,
          need,
          stock: ri.ingredient.stock,
        });
      }
    }
  }

  for (const [, need] of ingredientNeeds) {
    if (need.need > need.stock) {
      return {
        success: false,
        error: `Bahan "${need.name}" tidak cukup (butuh ${need.need} ${need.unit}, tersisa ${need.stock} ${need.unit}).`,
      };
    }
  }

  const cashReceived =
    input.paymentMethod === "CASH" ? input.cashReceived! : null;
  const changeAmount = cashReceived !== null ? cashReceived - total : null;

  try {
    const order = await prisma.$transaction(async (tx) => {
      for (const item of input.items) {
        const product = productMap.get(item.productId)!;
        if (product.trackStock) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      // Deduksi stok bahan mentah sesuai resep tiap produk
      for (const [ingredientId, need] of ingredientNeeds) {
        await tx.ingredient.update({
          where: { id: ingredientId },
          data: { stock: { decrement: need.need } },
        });
      }

      if (input.tableId) {
        await tx.table.update({
          where: { id: input.tableId },
          data: { status: "OCCUPIED" },
        });
      }

      return tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          subtotal,
          tax,
          taxRate,
          total,
          paymentMethod: input.paymentMethod,
          cashReceived,
          changeAmount,
          tableId: input.tableId ?? null,
          userId: session?.userId ?? null,
          items: {
            create: input.items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              price: item.price,
              quantity: item.quantity,
              subtotal: item.price * item.quantity,
            })),
          },
          kitchenTicket: {
            create: {
              ticketNumber: generateTicketNumber(),
              tableId: input.tableId ?? null,
              items: {
                create: input.items.map((item) => ({
                  productName: item.productName,
                  quantity: item.quantity,
                })),
              },
            },
          },
        },
        include: {
          items: {
            select: {
              productName: true,
              price: true,
              quantity: true,
              subtotal: true,
            },
          },
          kitchenTicket: {
            include: {
              items: true,
              table: { select: { number: true } },
            },
          },
        },
      });
    });

    if (order.kitchenTicket) {
      const ticket: KitchenTicketView = {
        id: order.kitchenTicket.id,
        ticketNumber: order.kitchenTicket.ticketNumber,
        status: order.kitchenTicket.status as KitchenTicketStatus,
        tableNumber: order.kitchenTicket.table?.number ?? null,
        orderNumber: order.orderNumber,
        createdAt: order.kitchenTicket.createdAt,
        items: order.kitchenTicket.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
        })),
      };

      await broadcastEvent({ type: "KITCHEN_NEW", ticket });
    }

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/kitchen");
    revalidatePath("/admin");

    const { kitchenTicket: _, ...orderResult } = order;
    return { success: true, order: orderResult };
  } catch {
    return { success: false, error: "Gagal menyimpan transaksi. Coba lagi." };
  }
}
