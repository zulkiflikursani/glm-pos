"use client";

import { PaymentMethod } from "@prisma/client";
import { Loader2, X } from "lucide-react";
import { useState, useTransition } from "react";

import { createOrder } from "@/app/actions";
import { formatIDR, parseIDRInput } from "@/lib/format";
import { useCart } from "@/store/cartStore";
import type { OrderResult } from "@/types";

import { Receipt } from "./Receipt";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: PaymentMethod.CASH, label: "Tunai" },
  { value: PaymentMethod.QRIS, label: "QRIS" },
  { value: PaymentMethod.DEBIT, label: "Debit" },
  { value: PaymentMethod.CREDIT, label: "Kredit" },
  { value: PaymentMethod.TRANSFER, label: "Transfer" },
];

type CheckoutModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (order: OrderResult) => void;
  tables: { id: string; number: number; status: string }[];
};

export function CheckoutModal({ open, onClose, onSuccess, tables }: CheckoutModalProps) {
  const { items, subtotal, tax, taxRate, total, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH,
  );
  const [cashInput, setCashInput] = useState("");
  const [tableId, setTableId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  const cashReceived = parseIDRInput(cashInput);
  const changeAmount =
    paymentMethod === PaymentMethod.CASH ? cashReceived - total : 0;

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await createOrder({
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        paymentMethod,
        cashReceived:
          paymentMethod === PaymentMethod.CASH ? cashReceived : undefined,
        tableId: tableId || undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      clearCart();
      onSuccess(result.order);
      onClose();
      setCashInput("");
      setTableId("");
      setPaymentMethod(PaymentMethod.CASH);
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 className="text-lg font-bold text-stone-900">Pembayaran</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <div className="mb-4 space-y-2 rounded-xl bg-stone-50 p-4 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatIDR(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Pajak ({Math.round(taxRate * 100)}%)</span>
              <span>{formatIDR(tax)}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>Total Bayar</span>
              <span className="text-orange-600">{formatIDR(total)}</span>
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="table-select"
              className="mb-2 block text-sm font-medium text-stone-700"
            >
              Meja (opsional)
            </label>
            <select
              id="table-select"
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none ring-orange-500 focus:ring-2"
            >
              <option value="">Tanpa meja / Take away</option>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  Meja {table.number}
                  {table.status === "OCCUPIED" ? " (terisi)" : ""}
                </option>
              ))}
            </select>
          </div>

          <p className="mb-2 text-sm font-medium text-stone-700">
            Metode Pembayaran
          </p>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.value}
                type="button"
                onClick={() => setPaymentMethod(method.value)}
                className={`rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                  paymentMethod === method.value
                    ? "bg-orange-600 text-white"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>

          {paymentMethod === PaymentMethod.CASH && (
            <div className="mb-4">
              <label
                htmlFor="cash-received"
                className="mb-2 block text-sm font-medium text-stone-700"
              >
                Nominal Tunai
              </label>
              <input
                id="cash-received"
                type="text"
                inputMode="numeric"
                value={cashInput}
                onChange={(e) => setCashInput(e.target.value)}
                placeholder="Rp 0"
                className="w-full rounded-xl border border-stone-200 px-4 py-3 text-lg font-semibold outline-none ring-orange-500 focus:ring-2"
              />
              {cashReceived > 0 && (
                <p
                  className={`mt-2 text-sm font-medium ${
                    changeAmount >= 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  Kembalian: {formatIDR(Math.max(changeAmount, 0))}
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="border-t border-stone-200 px-5 py-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !items.length}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:bg-stone-300"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Konfirmasi Pembayaran
          </button>
        </div>
      </div>
    </div>
  );
}

type OrderSuccessModalProps = {
  order: OrderResult | null;
  onClose: () => void;
};

export function OrderSuccessModal({ order, onClose }: OrderSuccessModalProps) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 text-center">
          <span className="text-5xl">✅</span>
          <h2 className="mt-3 text-xl font-bold text-stone-900">
            Pembayaran Berhasil
          </h2>
          <p className="mt-1 text-sm text-stone-500">{order.orderNumber}</p>
        </div>

        <div className="mb-6 rounded-xl border border-stone-200 p-4">
          <Receipt order={order} />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 rounded-xl border border-stone-200 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            Cetak Struk
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-orange-600 py-3 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Pesanan Baru
          </button>
        </div>
      </div>
    </div>
  );
}
