"use client";

import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  createIngredient,
  deleteIngredient,
  saveRecipe,
  updateIngredient,
} from "@/app/admin/actions";
import { formatIDR, parseIDRInput } from "@/lib/format";
import type { AdminIngredient, AdminProduct, AdminRecipe } from "@/types";

// ============================================================================
// IngredientManager — CRUD bahan mentah (raw material)
// ============================================================================

type IngredientManagerProps = {
  ingredients: AdminIngredient[];
};

const emptyIngredientForm = {
  name: "",
  unit: "",
  stock: "0",
  unitCost: "0",
  isActive: true,
};

export function IngredientManager({ ingredients }: IngredientManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(emptyIngredientForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const resetForm = () => {
    setForm(emptyIngredientForm);
    setEditingId(null);
    setShowForm(false);
    setError(null);
  };

  const startEdit = (ingredient: AdminIngredient) => {
    setEditingId(ingredient.id);
    setForm({
      name: ingredient.name,
      unit: ingredient.unit,
      stock: ingredient.stock.toString(),
      unitCost: ingredient.unitCost.toString(),
      isActive: ingredient.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    setError(null);
    const payload = {
      name: form.name,
      unit: form.unit,
      stock: parseFloat(form.stock) || 0,
      unitCost: parseIDRInput(form.unitCost),
      isActive: form.isActive,
    };

    startTransition(async () => {
      const result = editingId
        ? await updateIngredient(editingId, payload)
        : await createIngredient(payload);

      if (!result.success) {
        setError(result.error);
        return;
      }
      resetForm();
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    if (
      !confirm(
        "Nonaktifkan bahan ini? Bahan yang dipakai resep tidak bisa dihapus.",
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const result = await deleteIngredient(id);
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
          <h2 className="text-lg font-bold text-stone-900">Bahan Mentah</h2>
          <p className="mt-1 text-sm text-stone-500">
            Stok bahan baku untuk resep & perhitungan HPP
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
          Tambah Bahan
        </button>
      </div>

      {showForm && (
        <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50/50 p-4">
          <h3 className="font-medium text-stone-900">
            {editingId ? "Edit Bahan" : "Bahan Baru"}
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nama bahan (contoh: Beras)"
              className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none ring-orange-500 focus:ring-2"
            />
            <input
              type="text"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="Satuan (kg, liter, butir, dll)"
              className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none ring-orange-500 focus:ring-2"
            />
            <input
              type="text"
              inputMode="numeric"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              placeholder="Stok awal"
              className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none ring-orange-500 focus:ring-2"
            />
            <input
              type="text"
              inputMode="numeric"
              value={form.unitCost}
              onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
              placeholder="Harga beli per unit (Rp)"
              className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none ring-orange-500 focus:ring-2"
            />
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded border-stone-300"
            />
            Aktif
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
              <th className="pb-3 pr-4 font-medium">Bahan</th>
              <th className="pb-3 pr-4 font-medium">Satuan</th>
              <th className="pb-3 pr-4 font-medium">Stok</th>
              <th className="pb-3 pr-4 font-medium">Harga/Unit</th>
              <th className="pb-3 pr-4 font-medium">Status</th>
              <th className="pb-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-stone-400">
                  Belum ada bahan mentah. Tambah bahan untuk membuat resep.
                </td>
              </tr>
            ) : (
              ingredients.map((ingredient) => (
                <tr key={ingredient.id} className="border-b border-stone-100">
                  <td className="py-3 pr-4 font-medium text-stone-900">
                    {ingredient.name}
                  </td>
                  <td className="py-3 pr-4 text-stone-600">
                    {ingredient.unit}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={
                        ingredient.stock <= 0
                          ? "font-medium text-red-500"
                          : "text-stone-600"
                      }
                    >
                      {ingredient.stock} {ingredient.unit}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-medium text-stone-900">
                    {formatIDR(ingredient.unitCost)}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        ingredient.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {ingredient.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(ingredient)}
                        className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(ingredient.id)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// RecipeManager — CRUD resep produk (recipe → HPP & deduksi stok otomatis)
// ============================================================================

type RecipeManagerProps = {
  products: AdminProduct[];
  ingredients: AdminIngredient[];
  recipes: AdminRecipe[];
};

type DraftItem = {
  key: string;
  ingredientId: string;
  quantity: string;
};

function emptyDraftItem(): DraftItem {
  return {
    key: Math.random().toString(36).slice(2),
    ingredientId: "",
    quantity: "",
  };
}

export function RecipeManager({
  products,
  ingredients,
  recipes,
}: RecipeManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [draftItems, setDraftItems] = useState<DraftItem[]>([emptyDraftItem()]);

  const activeIngredients = ingredients.filter((i) => i.isActive);
  const recipeMap = new Map(recipes.map((r) => [r.productId, r]));

  const startEdit = (productId: string) => {
    const recipe = recipeMap.get(productId);
    setSelectedProductId(productId);
    if (recipe) {
      setDraftItems(
        recipe.items.map((item) => ({
          key: item.id,
          ingredientId: item.ingredientId,
          quantity: item.quantity.toString(),
        })),
      );
    } else {
      setDraftItems([emptyDraftItem()]);
    }
    setError(null);
    setShowForm(true);
  };

  const resetForm = () => {
    setSelectedProductId("");
    setDraftItems([emptyDraftItem()]);
    setShowForm(false);
    setError(null);
  };

  const updateDraftItem = (key: string, patch: Partial<DraftItem>) => {
    setDraftItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  };

  const addDraftItem = () => {
    setDraftItems((prev) => [...prev, emptyDraftItem()]);
  };

  const removeDraftItem = (key: string) => {
    setDraftItems((prev) =>
      prev.length === 1
        ? [emptyDraftItem()]
        : prev.filter((i) => i.key !== key),
    );
  };

  const computeDraftCost = (): number => {
    return draftItems.reduce((sum, item) => {
      if (!item.ingredientId) return sum;
      const ingredient = ingredients.find((i) => i.id === item.ingredientId);
      if (!ingredient) return sum;
      const qty = parseFloat(item.quantity) || 0;
      return sum + ingredient.unitCost * qty;
    }, 0);
  };

  const handleSubmit = () => {
    setError(null);
    if (!selectedProductId) {
      setError("Pilih produk terlebih dahulu.");
      return;
    }

    const items = draftItems
      .filter((i) => i.ingredientId && parseFloat(i.quantity) > 0)
      .map((i) => ({
        ingredientId: i.ingredientId,
        quantity: parseFloat(i.quantity),
      }));

    if (!items.length) {
      setError("Resep minimal harus memiliki 1 bahan dengan jumlah > 0.");
      return;
    }

    startTransition(async () => {
      const result = await saveRecipe({ productId: selectedProductId, items });
      if (!result.success) {
        setError(result.error);
        return;
      }
      resetForm();
      router.refresh();
    });
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-stone-900">Resep Produk</h2>
        <p className="mt-1 text-sm text-stone-500">
          Atur bahan penyusun tiap produk untuk HPP & deduksi stok otomatis
        </p>
      </div>

      {showForm && (
        <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50/50 p-4">
          <h3 className="font-medium text-stone-900">Atur Resep</h3>

          <select
            value={selectedProductId}
            onChange={(e) => startEdit(e.target.value)}
            className="mt-3 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none ring-orange-500 focus:ring-2"
          >
            <option value="">Pilih produk</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.emoji ?? "🍽️"} {product.name}
                {recipeMap.has(product.id) ? " (sudah ada resep)" : ""}
              </option>
            ))}
          </select>

          {activeIngredients.length === 0 ? (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Belum ada bahan mentah aktif. Tambah bahan dulu di atas.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {draftItems.map((item) => {
                const ingredient = ingredients.find(
                  (i) => i.id === item.ingredientId,
                );
                const lineCost = ingredient
                  ? ingredient.unitCost * (parseFloat(item.quantity) || 0)
                  : 0;
                return (
                  <div key={item.key} className="flex items-center gap-2">
                    <select
                      value={item.ingredientId}
                      onChange={(e) =>
                        updateDraftItem(item.key, {
                          ingredientId: e.target.value,
                        })
                      }
                      className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none ring-orange-500 focus:ring-2"
                    >
                      <option value="">Pilih bahan</option>
                      {activeIngredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} ({ing.unit}) — {formatIDR(ing.unitCost)}/
                          {ing.unit}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={item.quantity}
                      onChange={(e) =>
                        updateDraftItem(item.key, { quantity: e.target.value })
                      }
                      placeholder="Qty"
                      className="w-20 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none ring-orange-500 focus:ring-2"
                    />
                    <span className="text-xs text-stone-500">
                      {ingredient ? ingredient.unit : ""}
                    </span>
                    <span className="w-24 text-right text-xs text-stone-600">
                      {formatIDR(Math.round(lineCost))}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeDraftItem(item.key)}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={addDraftItem}
                className="flex items-center gap-1 rounded-lg bg-stone-100 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-200"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah bahan
              </button>
            </div>
          )}

          {draftItems.some((i) => i.ingredientId) && (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
              <span className="text-stone-500">HPP per porsi:</span>
              <span className="font-bold text-stone-900">
                {formatIDR(Math.round(computeDraftCost()))}
              </span>
            </div>
          )}

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
              Simpan Resep
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

      {!showForm && (
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="mt-4 flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" />
          Atur Resep Produk
        </button>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-stone-500">
              <th className="pb-3 pr-4 font-medium">Produk</th>
              <th className="pb-3 pr-4 font-medium">Bahan</th>
              <th className="pb-3 pr-4 font-medium">HPP</th>
              <th className="pb-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {recipes.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-stone-400">
                  Belum ada resep. Produk tanpa resep tidak mendeduksi stok
                  bahan.
                </td>
              </tr>
            ) : (
              recipes.map((recipe) => (
                <tr
                  key={recipe.id}
                  className="border-b border-stone-100 align-top"
                >
                  <td className="py-3 pr-4 font-medium text-stone-900">
                    {recipe.productName}
                  </td>
                  <td className="py-3 pr-4">
                    <ul className="space-y-0.5 text-stone-600">
                      {recipe.items.map((item) => (
                        <li key={item.id}>
                          {item.ingredientName}{" "}
                          <span className="text-stone-400">
                            {item.quantity} {item.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="py-3 pr-4 font-medium text-stone-900">
                    {formatIDR(Math.round(recipe.cost))}
                  </td>
                  <td className="py-3">
                    <button
                      type="button"
                      onClick={() => startEdit(recipe.productId)}
                      className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
