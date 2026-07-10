"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import { getOrderDetail } from "@/app/dashboard/actions";
import { formatIDR } from "@/lib/format";
import type { OrderHistoryItem, PaymentMethod } from "@/types";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: "Tunai",
  QRIS: "QRIS",
  DEBIT: "Debit",
  CREDIT: "Kredit",
  TRANSFER: "Transfer",
};

type OrderHistoryProps = {
  orders: OrderHistoryItem[];
};

export function OrderHistory({ orders }: OrderHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<
    Record<string, Awaited<ReturnType<typeof getOrderDetail>>>
  >({});

  const toggleOrder = async (orderId: string) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }

    if (!details[orderId]) {
      const detail = await getOrderDetail(orderId);
      setDetails((prev) => ({ ...prev, [orderId]: detail }));
    }
    setExpandedId(orderId);
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-stone-900">Riwayat Transaksi</h2>
      <p className="mt-1 text-sm text-stone-500">
        {orders.length} transaksi pada periode ini
      </p>

      {orders.length > 0 ? (
        <ul className="mt-4 divide-y divide-stone-100">
          {orders.map((order) => {
            const isExpanded = expandedId === order.id;
            const detail = details[order.id];

            return (
              <li key={order.id} className="py-3">
                <button
                  type="button"
                  onClick={() => toggleOrder(order.id)}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-stone-900">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-stone-500">
                      {new Date(order.createdAt).toLocaleString("id-ID")} ·{" "}
                      {PAYMENT_LABELS[order.paymentMethod]} · {order.itemCount}{" "}
                      item
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-orange-600">
                    {formatIDR(order.total)}
                  </p>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-stone-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-stone-400" />
                  )}
                </button>

                {isExpanded && detail && (
                  <ul className="mt-3 space-y-1 rounded-xl bg-stone-50 p-3 text-sm">
                    {detail.items.map((item, index) => (
                      <li
                        key={`${item.productName}-${index}`}
                        className="flex justify-between gap-2 text-stone-600"
                      >
                        <span>
                          {item.productName} x{item.quantity}
                        </span>
                        <span>{formatIDR(item.subtotal)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-8 text-center text-sm text-stone-400">
          Belum ada transaksi pada periode ini
        </p>
      )}
    </div>
  );
}
