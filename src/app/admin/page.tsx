import { getAdminCategories, getAdminProducts, getAdminUsers } from "@/app/admin/actions";
import { CategoryManager, ProductManager } from "@/components/admin/AdminPanel";
import { UserManager } from "@/components/admin/UserManager";

export default async function AdminRoute() {
  const [products, categories, users] = await Promise.all([
    getAdminProducts(),
    getAdminCategories(),
    getAdminUsers(),
  ]);

  return (
    <div className="mx-auto max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Admin Panel</h1>
        <p className="mt-1 text-sm text-stone-500">
          Kelola produk, kategori, stok, dan pengguna
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <CategoryManager categories={categories} />
        <ProductManager products={products} categories={categories} />
      </div>

      <UserManager users={users} />
    </div>
  );
}
