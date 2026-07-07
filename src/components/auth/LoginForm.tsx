"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";

import { login } from "@/app/login/actions";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="username"
          className="mb-1.5 block text-sm font-medium text-stone-700"
        >
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none ring-orange-500 focus:ring-2"
          placeholder="admin"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium text-stone-700"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none ring-orange-500 focus:ring-2"
          placeholder="••••••••"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:bg-stone-300"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Masuk
      </button>
    </form>
  );
}
