"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { broadcastEvent } from "@/lib/ws-notify";
import type { KitchenTicketView, KitchenTicketStatus } from "@/types";

function toTicketView(
  ticket: Awaited<ReturnType<typeof fetchTickets>>[number],
): KitchenTicketView {
  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    status: ticket.status as KitchenTicketStatus,
    tableNumber: ticket.table?.number ?? null,
    orderNumber: ticket.order.orderNumber,
    createdAt: ticket.createdAt,
    items: ticket.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
    })),
  };
}

async function fetchTickets(statuses?: KitchenTicketStatus[]) {
  return prisma.kitchenTicket.findMany({
    where: statuses ? { status: { in: statuses } } : undefined,
    include: {
      items: true,
      table: { select: { number: true } },
      order: { select: { orderNumber: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getKitchenTickets(
  activeOnly = true,
): Promise<KitchenTicketView[]> {
  const statuses: KitchenTicketStatus[] | undefined = activeOnly
    ? ["PENDING", "PREPARING", "READY"]
    : undefined;

  const tickets = await fetchTickets(statuses);
  return tickets.map(toTicketView);
}

export async function updateKitchenTicketStatus(
  ticketId: string,
  status: KitchenTicketStatus,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const ticket = await prisma.kitchenTicket.update({
      where: { id: ticketId },
      data: { status },
      include: {
        items: true,
        table: { select: { number: true } },
        order: { select: { orderNumber: true } },
      },
    });

    if (status === "DONE") {
      if (ticket.tableId) {
        await prisma.table.update({
          where: { id: ticket.tableId },
          data: { status: "EMPTY" },
        });
      }
    }

    const view = toTicketView(ticket);

    await broadcastEvent({
      type: status === "DONE" ? "KITCHEN_DONE" : "KITCHEN_UPDATE",
      ticket: view,
    });

    revalidatePath("/kitchen");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal memperbarui status tiket." };
  }
}
