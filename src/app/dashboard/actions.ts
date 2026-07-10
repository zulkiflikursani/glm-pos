"use server";

import { getDateRange } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import type {
  DashboardStats,
  OrderHistoryItem,
  OrderStatus,
  TopProduct,
} from "@/types";

function completedOrderFilter(dateFrom: string, dateTo: string) {
  const { start, end } = getDateRange(dateFrom, dateTo);
  return {
    status: "COMPLETED" as OrderStatus,
    createdAt: { gte: start, lte: end },
  };
}

export async function getDashboardStats(
  dateFrom: string,
  dateTo: string,
): Promise<DashboardStats> {
  const where = completedOrderFilter(dateFrom, dateTo);

  const aggregate = await prisma.order.aggregate({
    where,
    _sum: { total: true },
    _count: { id: true },
  });

  const totalRevenue = aggregate._sum.total ?? 0;
  const orderCount = aggregate._count.id;
  const averageOrder =
    orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;

  return { totalRevenue, orderCount, averageOrder };
}

export async function getTopProducts(
  dateFrom: string,
  dateTo: string,
  limit = 5,
): Promise<TopProduct[]> {
  const { start, end } = getDateRange(dateFrom, dateTo);

  const grouped = await prisma.orderItem.groupBy({
    by: ["productName"],
    where: {
      order: {
        status: "COMPLETED" as OrderStatus,
        createdAt: { gte: start, lte: end },
      },
    },
    _sum: { quantity: true, subtotal: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  return grouped.map((item) => ({
    productName: item.productName,
    quantity: item._sum.quantity ?? 0,
    revenue: item._sum.subtotal ?? 0,
  }));
}

export async function getOrderHistory(
  dateFrom: string,
  dateTo: string,
): Promise<OrderHistoryItem[]> {
  const orders = await prisma.order.findMany({
    where: completedOrderFilter(dateFrom, dateTo),
    include: {
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    total: order.total,
    paymentMethod: order.paymentMethod,
    itemCount: order._count.items,
    createdAt: order.createdAt,
  }));
}

export async function getOrderDetail(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        select: {
          productName: true,
          price: true,
          quantity: true,
          subtotal: true,
        },
      },
    },
  });
}
