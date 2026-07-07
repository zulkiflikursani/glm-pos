"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import {
  getDashboardStats,
  getOrderHistory,
  getTopProducts,
} from "@/app/dashboard/actions";
import { toDateInputValue } from "@/lib/date";
import type {
  DashboardStats,
  OrderHistoryItem,
  TopProduct,
} from "@/types";

import { DateFilter } from "./DateFilter";
import { OrderHistory } from "./OrderHistory";
import { StatsCards } from "./StatsCards";
import { TopProducts } from "./TopProducts";

type DashboardPageProps = {
  initialDateFrom: string;
  initialDateTo: string;
  initialStats: DashboardStats;
  initialTopProducts: TopProduct[];
  initialOrders: OrderHistoryItem[];
};

export function DashboardPage({
  initialDateFrom,
  initialDateTo,
  initialStats,
  initialTopProducts,
  initialOrders,
}: DashboardPageProps) {
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);
  const [stats, setStats] = useState(initialStats);
  const [topProducts, setTopProducts] = useState(initialTopProducts);
  const [orders, setOrders] = useState(initialOrders);
  const [isPending, startTransition] = useTransition();

  const loadData = useCallback((from: string, to: string) => {
    startTransition(async () => {
      const [newStats, newTopProducts, newOrders] = await Promise.all([
        getDashboardStats(from, to),
        getTopProducts(from, to),
        getOrderHistory(from, to),
      ]);
      setStats(newStats);
      setTopProducts(newTopProducts);
      setOrders(newOrders);
    });
  }, []);

  useEffect(() => {
    if (dateFrom === initialDateFrom && dateTo === initialDateTo) return;
    loadData(dateFrom, dateTo);
  }, [dateFrom, dateTo, initialDateFrom, initialDateTo, loadData]);

  const handleToday = () => {
    const today = toDateInputValue(new Date());
    setDateFrom(today);
    setDateTo(today);
  };

  return (
    <div className="mx-auto max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Laporan Penjualan</h1>
        <p className="mt-1 text-sm text-stone-500">
          Pantau pendapatan dan transaksi harian
        </p>
      </div>

      <DateFilter
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onToday={handleToday}
      />

      {isPending && (
        <p className="text-sm text-stone-500">Memuat data...</p>
      )}

      <StatsCards stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <TopProducts products={topProducts} />
        <OrderHistory orders={orders} />
      </div>
    </div>
  );
}
