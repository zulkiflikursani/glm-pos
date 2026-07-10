"use client";

import { useRef } from "react";

import { formatIDR } from "@/lib/format";
import type { OrderResult, PaymentMethod } from "@/types";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: "Tunai",
  QRIS: "QRIS",
  DEBIT: "Debit",
  CREDIT: "Kredit",
  TRANSFER: "Transfer",
};

type ReceiptProps = {
  order: OrderResult;
};

export function Receipt({ order }: ReceiptProps) {
  return (
    <div className="mx-auto w-full max-w-xs font-mono text-xs text-black">
      <div className="text-center">
        <p className="text-sm font-bold">POS Resto</p>
        <p className="mt-1">Struk Pembayaran</p>
        <p className="mt-2">{order.orderNumber}</p>
        <p>{new Date(order.createdAt).toLocaleString("id-ID")}</p>
      </div>
      <div className="my-3 border-t border-dashed border-black" />
      <ul className="space-y-1">
        {order.items.map((item, index) => (
          <li key={`${item.productName}-${index}`}>
            <div className="flex justify-between gap-2">
              <span className="flex-1">
                {item.productName} x{item.quantity}
              </span>
              <span>{formatIDR(item.subtotal)}</span>
            </div>
          </li>
        ))}
      </ul>
      <div className="my-3 border-t border-dashed border-black" />
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatIDR(order.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Pajak ({Math.round(order.taxRate * 100)}%)</span>
          <span>{formatIDR(order.tax)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>{formatIDR(order.total)}</span>
        </div>
        <div className="flex justify-between">
          <span>Metode</span>
          <span>{PAYMENT_LABELS[order.paymentMethod]}</span>
        </div>
        {order.cashReceived !== null && (
          <>
            <div className="flex justify-between">
              <span>Tunai</span>
              <span>{formatIDR(order.cashReceived)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kembalian</span>
              <span>{formatIDR(order.changeAmount ?? 0)}</span>
            </div>
          </>
        )}
      </div>
      <div className="my-3 border-t border-dashed border-black" />
      <p className="text-center">Terima kasih!</p>
    </div>
  );
}

type ReceiptPrintAreaProps = {
  order: OrderResult | null;
};

export function ReceiptPrintArea({ order }: ReceiptPrintAreaProps) {
  const ref = useRef<HTMLDivElement>(null);

  if (!order) return null;

  return (
    <div ref={ref} className="hidden print:block">
      <Receipt order={order} />
    </div>
  );
}
