import { formatIDR } from "@/lib/format";
import type { DashboardStats } from "@/types";

type StatsCardsProps = {
  stats: DashboardStats;
};

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: "Total Pendapatan",
      value: formatIDR(stats.totalRevenue),
      icon: "💰",
    },
    {
      label: "Jumlah Transaksi",
      value: stats.orderCount.toString(),
      icon: "🧾",
    },
    {
      label: "Rata-rata per Transaksi",
      value: formatIDR(stats.averageOrder),
      icon: "📊",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-stone-500">{card.label}</p>
              <p className="mt-2 text-2xl font-bold text-stone-900">
                {card.value}
              </p>
            </div>
            <span className="text-2xl">{card.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
