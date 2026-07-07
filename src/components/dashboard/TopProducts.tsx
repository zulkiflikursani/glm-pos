import { formatIDR } from "@/lib/format";
import type { TopProduct } from "@/types";

type TopProductsProps = {
  products: TopProduct[];
};

export function TopProducts({ products }: TopProductsProps) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-stone-900">Produk Terlaris</h2>
      <p className="mt-1 text-sm text-stone-500">Berdasarkan jumlah terjual</p>

      {products.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {products.map((product, index) => (
            <li
              key={product.productName}
              className="flex items-center gap-3 rounded-xl bg-stone-50 p-3"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-stone-900">
                  {product.productName}
                </p>
                <p className="text-xs text-stone-500">
                  {product.quantity} terjual
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-orange-600">
                {formatIDR(product.revenue)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-center text-sm text-stone-400">
          Belum ada penjualan pada periode ini
        </p>
      )}
    </div>
  );
}
