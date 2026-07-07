"use client";

import { ShoppingCart, X } from "lucide-react";

import { formatIDR } from "@/lib/format";
import { useCart } from "@/store/cartStore";

import { CartItemRow } from "./CartItemRow";

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
};

export function CartDrawer({ open, onClose, onCheckout }: CartDrawerProps) {
  const { subtotal, tax, taxRate, total, itemCount, items } = useCart();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Tutup keranjang"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="absolute bottom-0 right-0 top-0 flex w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Keranjang</h2>
            <p className="text-sm text-stone-500">{itemCount} item</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-600"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden px-5 py-4">
          <CartItemRow />
        </div>

        <div className="border-t border-stone-200 px-5 py-4 pb-8">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span>{formatIDR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Pajak ({Math.round(taxRate * 100)}%)</span>
              <span>{formatIDR(tax)}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="text-orange-600">{formatIDR(total)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onCheckout}
            disabled={!items.length}
            className="mt-4 w-full rounded-xl bg-orange-600 py-4 text-base font-semibold text-white disabled:bg-stone-300"
          >
            Bayar Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}

type CartFabProps = {
  onClick: () => void;
};

export function CartFab({ onClick }: CartFabProps) {
  const { itemCount, total } = useCart();

  if (!itemCount) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full bg-orange-600 px-5 py-4 text-white shadow-lg lg:hidden"
    >
      <ShoppingCart className="h-6 w-6" />
      <span className="font-semibold">{itemCount} item</span>
      <span className="font-bold">{formatIDR(total)}</span>
    </button>
  );
}
