"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { broadcastEvent } from "@/lib/ws-notify";
import type {
  KitchenTicketStatus,
  TableDetailView,
  TableStatus,
  TableStatusUpdateInput,
} from "@/types";

const VALID_STATUSES: TableStatus[] = [
  "EMPTY",
  "OCCUPIED",
  "RESERVED",
  "CLEANING",
];

export async function getTableDetails(): Promise<TableView[]> {
  const tables = await prisma.table.findMany({
    orderBy: { number: "asc" },
    include: {
      orders: {
        where: { status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          orderNumber: true,
          total: true,
          createdAt: true,
          items: {
            select: { productName: true, quantity: true },
          },
        },
      },
      kitchenTickets: {
        where: {
          status: { in: ["PENDING", "PREPARING", "READY"] as const },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          ticketNumber: true,
          status: true,
        },
      },
    },
  });

  return tables.map((table) => {
    const currentOrder = table.orders[0] ?? null;
    const activeTicket = table.kitchenTickets[0] ?? null;

    return {
      id: table.id,
      number: table.number,
      status: table.status as TableStatus,
      currentOrder: currentOrder
        ? {
            id: currentOrder.id,
            orderNumber: currentOrder.orderNumber,
            total: currentOrder.total,
            createdAt: currentOrder.createdAt,
            items: currentOrder.items.map((item) => ({
              productName: item.productName,
              quantity: item.quantity,
            })),
          }
        : null,
      activeTicket: activeTicket
        ? {
            id: activeTicket.id,
            ticketNumber: activeTicket.ticketNumber,
            status: activeTicket.status as KitchenTicketStatus,
          }
        : null,
    };
  });
}

export type TableView = TableDetailView;

export async function updateTableStatus(
  input: TableStatusUpdateInput,
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await getSession();

  // Hanya pelayan, kasir, atau admin yang boleh mengubah status meja
  if (!session || !["ADMIN", "KASIR", "PELAYAN"].includes(session.role)) {
    return { success: false, error: "Tidak punya akses." };
  }

  if (!VALID_STATUSES.includes(input.status)) {
    return { success: false, error: "Status meja tidak valid." };
  }

  try {
    const table = await prisma.table.findUnique({
      where: { id: input.id },
      select: { id: true, number: true, status: true },
    });

    if (!table) {
      return { success: false, error: "Meja tidak ditemukan." };
    }

    await prisma.table.update({
      where: { id: input.id },
      data: { status: input.status },
    });

    await broadcastEvent({
      type: "TABLE_UPDATE",
      table: { id: table.id, number: table.number, status: input.status },
    });

    revalidatePath("/tables");
    revalidatePath("/");
    revalidatePath("/kitchen");

    return { success: true };
  } catch {
    return {
      success: false,
      error: "Gagal memperbarui status meja. Coba lagi.",
    };
  }
}

export async function resetTable(
  tableId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  // Alias singkat untuk updateTableStatus → EMPTY + bersihkan tiket aktif
  const session = await getSession();

  if (!session || !["ADMIN", "KASIR", "PELAYAN"].includes(session.role)) {
    return { success: false, error: "Tidak punya akses." };
  }

  try {
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      select: { id: true, number: true },
    });

    if (!table) {
      return { success: false, error: "Meja tidak ditemukan." };
    }

    await prisma.$transaction([
      prisma.table.update({
        where: { id: tableId },
        data: { status: "EMPTY" },
      }),
      prisma.kitchenTicket.updateMany({
        where: {
          tableId,
          status: { in: ["PENDING", "PREPARING", "READY"] },
        },
        data: { status: "DONE" },
      }),
    ]);

    await broadcastEvent({
      type: "TABLE_UPDATE",
      table: { id: table.id, number: table.number, status: "EMPTY" },
    });

    revalidatePath("/tables");
    revalidatePath("/");
    revalidatePath("/kitchen");

    return { success: true };
  } catch {
    return {
      success: false,
      error: "Gagal mereset meja. Coba lagi.",
    };
  }
}
