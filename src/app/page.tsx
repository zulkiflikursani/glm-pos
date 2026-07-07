import { getCategories, getProducts, getTables, getTaxRate } from "@/app/actions";
import { PosPage } from "@/components/pos/PosPage";
import { CartProvider } from "@/store/cartStore";

export default async function Home() {
  const [products, categories, taxRate, tables] = await Promise.all([
    getProducts(),
    getCategories(),
    getTaxRate(),
    getTables(),
  ]);

  return (
    <CartProvider taxRate={taxRate}>
      <PosPage products={products} categories={categories} tables={tables} />
    </CartProvider>
  );
}
