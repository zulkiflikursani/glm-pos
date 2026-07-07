"use client";

import type { UserRole } from "@prisma/client";
import {
  BarChart3,
  ChefHat,
  LogOut,
  Settings,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { logout } from "@/app/login/actions";
import { ROLE_LABELS, type SessionUser } from "@/lib/roles";

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: typeof ShoppingBag;
  roles: UserRole[];
}[] = [
  { href: "/", label: "Kasir", icon: ShoppingBag, roles: ["ADMIN", "KASIR", "PELAYAN"] },
  { href: "/dashboard", label: "Laporan", icon: BarChart3, roles: ["ADMIN", "KASIR"] },
  { href: "/kitchen", label: "Dapur", icon: ChefHat, roles: ["ADMIN", "KASIR"] },
  { href: "/admin", label: "Admin", icon: Settings, roles: ["ADMIN"] },
];

type AppNavProps = {
  user: SessionUser;
};

export function AppNav({ user }: AppNavProps) {
  const pathname = usePathname();
  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(user.role),
  );

  return (
    <nav className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-1 px-4 sm:px-6">
        <span className="mr-4 hidden text-sm font-bold text-orange-600 sm:inline">
          POS Resto
        </span>
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-orange-50 text-orange-700"
                  : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium text-stone-900">{user.name}</p>
            <p className="text-xs text-stone-500">{ROLE_LABELS[user.role]}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-stone-500 hover:bg-stone-50 hover:text-stone-900"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
