import {
  getDashboardStats,
  getOrderHistory,
  getTopProducts,
} from "@/app/dashboard/actions";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { toDateInputValue } from "@/lib/date";

export default async function DashboardRoute() {
  const today = toDateInputValue(new Date());

  const [stats, topProducts, orders] = await Promise.all([
    getDashboardStats(today, today),
    getTopProducts(today, today),
    getOrderHistory(today, today),
  ]);

  return (
    <DashboardPage
      initialDateFrom={today}
      initialDateTo={today}
      initialStats={stats}
      initialTopProducts={topProducts}
      initialOrders={orders}
    />
  );
}
