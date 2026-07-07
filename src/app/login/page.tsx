import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <span className="text-4xl">🍽️</span>
          <h1 className="mt-3 text-2xl font-bold text-stone-900">POS Resto</h1>
          <p className="mt-1 text-sm text-stone-500">Masuk untuk melanjutkan</p>
        </div>
        <LoginForm />
        <div className="mt-6 rounded-xl bg-stone-50 p-4 text-xs text-stone-500">
          <p className="font-medium text-stone-700">Akun demo:</p>
          <p className="mt-1">admin / admin123</p>
          <p>kasir / kasir123</p>
          <p>pelayan / pelayan123</p>
        </div>
      </div>
    </div>
  );
}
