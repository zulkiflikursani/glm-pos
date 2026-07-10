"use client";

import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createUser, deleteUser, updateUser } from "@/app/admin/actions";
import { ROLE_LABELS } from "@/lib/roles";
import type { AdminUser, UserRole } from "@/types";

const ROLES: UserRole[] = ["ADMIN", "KASIR", "PELAYAN", "DAPUR"];

type UserManagerProps = {
  users: AdminUser[];
};

const emptyUserForm = {
  name: "",
  username: "",
  password: "",
  role: "KASIR" as UserRole,
  isActive: true,
};

export function UserManager({ users }: UserManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(emptyUserForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setForm(emptyUserForm);
    setEditingId(null);
    setShowForm(false);
    setError(null);
  };

  const startEdit = (user: AdminUser) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      username: user.username,
      password: "",
      role: user.role,
      isActive: user.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    setError(null);
    const payload = {
      name: form.name,
      username: form.username,
      password: form.password || undefined,
      role: form.role,
      isActive: form.isActive,
    };

    startTransition(async () => {
      const result = editingId
        ? await updateUser(editingId, payload)
        : await createUser({ ...payload, password: form.password });

      if (!result.success) {
        setError(result.error);
        return;
      }
      resetForm();
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Nonaktifkan pengguna ini?")) return;
    startTransition(async () => {
      const result = await deleteUser(id);
      if (!result.success) setError(result.error);
      else router.refresh();
    });
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Pengguna</h2>
          <p className="mt-1 text-sm text-stone-500">
            Kelola akun Admin, Kasir, dan Pelayan
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
          Tambah User
        </button>
      </div>

      {showForm && (
        <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50/50 p-4">
          <h3 className="font-medium text-stone-900">
            {editingId ? "Edit Pengguna" : "Pengguna Baru"}
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nama lengkap"
              className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none ring-orange-500 focus:ring-2"
            />
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Username"
              className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none ring-orange-500 focus:ring-2"
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={editingId ? "Password baru (opsional)" : "Password"}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none ring-orange-500 focus:ring-2"
            />
            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as UserRole })
              }
              className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none ring-orange-500 focus:ring-2"
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded border-stone-300"
            />
            Akun aktif
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
              className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-medium text-white disabled:bg-stone-300"
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
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-stone-500">
              <th className="pb-3 pr-4 font-medium">Nama</th>
              <th className="pb-3 pr-4 font-medium">Username</th>
              <th className="pb-3 pr-4 font-medium">Role</th>
              <th className="pb-3 pr-4 font-medium">Status</th>
              <th className="pb-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-stone-100">
                <td className="py-3 pr-4 font-medium">{user.name}</td>
                <td className="py-3 pr-4 text-stone-600">{user.username}</td>
                <td className="py-3 pr-4">
                  <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                    {ROLE_LABELS[user.role]}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      user.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {user.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(user)}
                      className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(user.id)}
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
