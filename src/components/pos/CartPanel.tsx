"use client";

import { formatIDR } from "@/lib/format";
import { useCart } from "@/store/cartStore";

import { CartItemRow } from "./CartItemRow";

type CartSummaryProps = {
  onCheckout: () => void;
};

export function CartSummary({ onCheckout }: CartSummaryProps) {
  const { items, subtotal, tax, taxRate, total } = useCart();

  return (
    <div className="flex h-full flex-col border-l border-stone-200 bg-white">
      <div className="border-b border-stone-200 px-5 py-4">
        <h2 className="text-lg font-bold text-stone-900">Keranjang</h2>
        <p className="text-sm text-stone-500">{items.length} item dipilih</p>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden px-5 py-4">
        <CartItemRow />
      </div>

      <div className="border-t border-stone-200 px-5 py-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-stone-600">
            <span>Subtotal</span>
            <span>{formatIDR(subtotal)}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Pajak ({Math.round(taxRate * 100)}%)</span>
            <span>{formatIDR(tax)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-stone-900">
            <span>Total</span>
            <span className="text-orange-600">{formatIDR(total)}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onCheckout}
          disabled={!items.length}
          className="mt-4 w-full rounded-xl bg-orange-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          Bayar Sekarang
        </button>
      </div>
    </div>
  );
}
