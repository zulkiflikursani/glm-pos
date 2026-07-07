"use client";

import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  updateCategory,
  updateProduct,
} from "@/app/admin/actions";
import { formatIDR, parseIDRInput } from "@/lib/format";
import type { AdminCategory, AdminProduct } from "@/types";

type CategoryManagerProps = {
  categories: AdminCategory[];
};

export function CategoryManager({ categories }: CategoryManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    setError(null);
    startTransition(async () => {
      const result = await createCategory({ name });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setName("");
      router.refresh();
    });
  };

  const handleUpdate = (id: string) => {
    setError(null);
    startTransition(async () => {
      const result = await updateCategory(id, { name: editName });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setEditingId(null);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Hapus kategori ini?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-stone-900">Kategori</h2>
      <p className="mt-1 text-sm text-stone-500">Kelola kategori menu</p>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama kategori baru"
          className="flex-1 rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none ring-orange-500 focus:ring-2"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={isPending || !name.trim()}
          className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:bg-stone-300"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Tambah
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <ul className="mt-4 divide-y divide-stone-100">
        {categories.map((category) => (
          <li
            key={category.id}
            className="flex items-center gap-2 py-3 first:pt-0"
          >
            {editingId === category.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none ring-orange-500 focus:ring-2"
                />
                <button
                  type="button"
                  onClick={() => handleUpdate(category.id)}
                  className="rounded-lg bg-orange-600 px-3 py-2 text-xs font-medium text-white"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded-lg bg-stone-100 p-2 text-stone-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <p className="font-medium text-stone-900">{category.name}</p>
                  <p className="text-xs text-stone-500">
                    {category.productCount} produk
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(category.id);
                    setEditName(category.name);
                  }}
                  className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(category.id)}
                  className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

type ProductManagerProps = {
  products: AdminProduct[];
  categories: AdminCategory[];
};

const emptyForm = {
  name: "",
  price: "",
  emoji: "",
  categoryId: "",
  stock: "0",
  trackStock: false,
  isActive: true,
};

export function ProductManager({ products, categories }: ProductManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const resetForm = () => {
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id ?? "",
    });
    setEditingId(null);
    setShowForm(false);
    setError(null);
  };

  const startEdit = (product: AdminProduct) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      price: product.price.toString(),
      emoji: product.emoji ?? "",
      categoryId: product.categoryId,
      stock: product.stock.toString(),
      trackStock: product.trackStock,
      isActive: product.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    setError(null);
    const payload = {
      name: form.name,
      price: parseIDRInput(form.price),
      emoji: form.emoji,
      categoryId: form.categoryId,
      stock: parseInt(form.stock, 10) || 0,
      trackStock: form.trackStock,
      isActive: form.isActive,
    };

    startTransition(async () => {
      const result = editingId
        ? await updateProduct(editingId, payload)
        : await createProduct(payload);

      if (!result.success) {
        setError(result.error);
        return;
      }
      resetForm();
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Nonaktifkan produk ini dari menu kasir?")) return;
    startTransition(async () => {
      const result = await deleteProduct(id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Produk</h2>
          <p className="mt-1 text-sm text-stone-500">
            Kelola menu yang tampil di kasir
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" />
          Tambah Produk
        </button>
      </div>

      {showForm && (
        <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50/50 p-4">
          <h3 className="font-medium text-stone-900">
            {editingId ? "Edit Produk" : "Produk Baru"}
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nama produk"
              className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none ring-orange-500 focus:ring-2"
            />
            <input
              type="text"
              inputMode="numeric"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Harga (Rp)"
              className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none ring-orange-500 focus:ring-2"
            />
            <input
              type="text"
              value={form.emoji}
              onChange={(e) => setForm({ ...form, emoji: e.target.value })}
              placeholder="Emoji (opsional)"
              className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none ring-orange-500 focus:ring-2"
            />
            <select
              value={form.categoryId}
              onChange={(e) =>
                setForm({ ...form, categoryId: e.target.value })
              }
              className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none ring-orange-500 focus:ring-2"
            >
              <option value="">Pilih kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              inputMode="numeric"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              placeholder="Stok awal"
              className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none ring-orange-500 focus:ring-2"
            />
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={form.trackStock}
              onChange={(e) =>
                setForm({ ...form, trackStock: e.target.checked })
              }
              className="rounded border-stone-300"
            />
            Lacak stok (kurangi otomatis saat terjual)
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm({ ...form, isActive: e.target.checked })
              }
              className="rounded border-stone-300"
            />
            Aktif di kasir
          </label>
          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:bg-stone-300"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl bg-stone-100 px-4 py-2.5 text-sm font-medium text-stone-700"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-stone-500">
              <th className="pb-3 pr-4 font-medium">Produk</th>
              <th className="pb-3 pr-4 font-medium">Kategori</th>
              <th className="pb-3 pr-4 font-medium">Harga</th>
              <th className="pb-3 pr-4 font-medium">Stok</th>
              <th className="pb-3 pr-4 font-medium">Status</th>
              <th className="pb-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-stone-100">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{product.emoji ?? "🍽️"}</span>
                    <span className="font-medium text-stone-900">
                      {product.name}
                    </span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-stone-600">
                  {product.category.name}
                </td>
                <td className="py-3 pr-4 font-medium text-stone-900">
                  {formatIDR(product.price)}
                </td>
                <td className="py-3 pr-4 text-stone-600">
                  {product.trackStock ? (
                    <span
                      className={
                        product.stock <= 5
                          ? "font-medium text-red-500"
                          : undefined
                      }
                    >
                      {product.stock}
                    </span>
                  ) : (
                    <span className="text-stone-400">—</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      product.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {product.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(product)}
                      className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product.id)}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
