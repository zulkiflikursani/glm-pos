"use client";

import { useMemo, useState } from "react";

import type { CategoryOption, OrderResult, ProductWithCategory, TableOption } from "@/types";

import { CartDrawer, CartFab } from "./CartDrawer";
import { CartSummary } from "./CartPanel";
import { CategoryFilter } from "./CategoryFilter";
import { CheckoutModal, OrderSuccessModal } from "./CheckoutModal";
import { ProductCard } from "./ProductCard";
import { ReceiptPrintArea } from "./Receipt";
import { SearchBar } from "./SearchBar";

type PosPageProps = {
  products: ProductWithCategory[];
  categories: CategoryOption[];
  tables: TableOption[];
};

export function PosPage({ products, categories, tables }: PosPageProps) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderResult | null>(null);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchCategory = !categoryId || product.categoryId === categoryId;
      const matchSearch =
        !term || product.name.toLowerCase().includes(term);
      return matchCategory && matchSearch;
    });
  }, [products, categoryId, search]);

  const openCheckout = () => {
    setDrawerOpen(false);
    setCheckoutOpen(true);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-stone-100 lg:flex-row">
      <section className="flex min-h-0 flex-1 flex-col">
        <header className="border-b border-stone-200 bg-white px-4 py-3 sm:px-6">
          <h1 className="text-lg font-bold text-stone-900">Kasir</h1>
          <p className="text-sm text-stone-500">Pilih menu untuk ditambahkan</p>
        </header>

        <div className="space-y-4 px-4 py-4 sm:px-6">
          <SearchBar value={search} onChange={setSearch} />
          <CategoryFilter
            categories={categories}
            selectedId={categoryId}
            onSelect={setCategoryId}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-24 sm:px-6 lg:pb-6">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-stone-400">
              <p>Menu tidak ditemukan</p>
            </div>
          )}
        </div>
      </section>

      <aside className="hidden w-full max-w-md shrink-0 lg:flex lg:flex-col">
        <CartSummary onCheckout={openCheckout} />
      </aside>

      <CartFab onClick={() => setDrawerOpen(true)} />
      <CartDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCheckout={openCheckout}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={setCompletedOrder}
        tables={tables}
      />
      <OrderSuccessModal
        order={completedOrder}
        onClose={() => setCompletedOrder(null)}
      />
      <ReceiptPrintArea order={completedOrder} />
    </div>
  );
}
