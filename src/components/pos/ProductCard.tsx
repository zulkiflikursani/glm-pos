"use client";

import { formatIDR } from "@/lib/format";
import { useCart } from "@/store/cartStore";
import type { ProductWithCategory } from "@/types";

type ProductCardProps = {
  product: ProductWithCategory;
};

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const outOfStock = product.trackStock && product.stock <= 0;

  return (
    <button
      type="button"
      onClick={() => addItem(product)}
      disabled={outOfStock}
      className="flex flex-col items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm transition-all hover:border-orange-300 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-50 text-3xl">
        {product.emoji ?? "🍽️"}
      </span>
      <div className="w-full">
        <p className="line-clamp-2 text-sm font-semibold text-stone-900">
          {product.name}
        </p>
        <p className="mt-1 text-xs text-stone-500">{product.category.name}</p>
        {product.trackStock && (
          <p
            className={`mt-1 text-xs font-medium ${
              product.stock <= 5 ? "text-red-500" : "text-stone-400"
            }`}
          >
            Stok: {product.stock}
          </p>
        )}
        <p className="mt-2 text-base font-bold text-orange-600">
          {formatIDR(product.price)}
        </p>
        {outOfStock && (
          <p className="mt-1 text-xs font-medium text-red-500">Habis</p>
        )}
      </div>
    </button>
  );
}
