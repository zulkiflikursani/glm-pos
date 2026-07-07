"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

import { formatIDR } from "@/lib/format";
import { useCart } from "@/store/cartStore";

export function CartItemRow() {
  const { items, updateQuantity, removeItem } = useCart();

  if (!items.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-stone-400">
        <span className="text-4xl">🛒</span>
        <p className="text-sm">Keranjang masih kosong</p>
        <p className="text-xs">Tap menu untuk menambahkan item</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-1 flex-col gap-3 overflow-y-auto">
      {items.map((item) => (
        <li
          key={item.productId}
          className="flex items-center gap-3 rounded-xl bg-stone-50 p-3"
        >
          <span className="text-2xl">{item.emoji ?? "🍽️"}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-stone-900">
              {item.name}
            </p>
            <p className="text-xs text-stone-500">{formatIDR(item.price)}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100"
              aria-label="Kurangi jumlah"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center text-sm font-semibold">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100"
              aria-label="Tambah jumlah"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => removeItem(item.productId)}
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
              aria-label="Hapus item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
