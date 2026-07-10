"use client";

import { CheckCircle2, Clock, Loader2, Users, Utensils } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import {
  getTableDetails,
  resetTable,
  updateTableStatus,
  type TableView,
} from "@/app/tables/actions";
import { formatIDR } from "@/lib/format";
import type { TableStatus } from "@/types";

const STATUS_CONFIG: Record<
  TableStatus,
  { label: string; color: string; dot: string; icon: ReactNode }
> = {
  EMPTY: {
    label: "Kosong",
    color: "bg-white border-stone-200",
    dot: "bg-stone-300",
    icon: <CheckCircle2 className="h-4 w-4 text-stone-400" />,
  },
  OCCUPIED: {
    label: "Terisi",
    color: "bg-orange-50 border-orange-200",
    dot: "bg-orange-500",
    icon: <Utensils className="h-4 w-4 text-orange-600" />,
  },
  RESERVED: {
    label: "Dipesan",
    color: "bg-blue-50 border-blue-200",
    dot: "bg-blue-500",
    icon: <Clock className="h-4 w-4 text-blue-600" />,
  },
  CLEANING: {
    label: "Pembersihan",
    color: "bg-purple-50 border-purple-200",
    dot: "bg-purple-500",
    icon: <Loader2 className="h-4 w-4 text-purple-600" />,
  },
};

type TableManagerProps = {
  initialTables: TableView[];
};

export function TableManager({ initialTables }: TableManagerProps) {
  const router = useRouter();
  const [tables, setTables] = useState(initialTables);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const refresh = useCallback(async () => {
    const data = await getTableDetails();
    setTables(data);
  }, []);

  useEffect(() => {
    setTables(initialTables);
  }, [initialTables]);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001";
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        reconnectTimer = setTimeout(connect, 3000);
      };
      ws.onmessage = () => {
        refresh();
        router.refresh();
      };
    };

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [refresh, router]);

  const handleUpdateStatus = (id: string, status: TableStatus) => {
    setError(null);
    startTransition(async () => {
      const result = await updateTableStatus({ id, status });
      if (result.success) {
        await refresh();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const handleReset = (id: string) => {
    setError(null);
    startTransition(async () => {
      const result = await resetTable(id);
      if (result.success) {
        await refresh();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const counts = {
    total: tables.length,
    empty: tables.filter((t) => t.status === "EMPTY").length,
    occupied: tables.filter((t) => t.status === "OCCUPIED").length,
    reserved: tables.filter((t) => t.status === "RESERVED").length,
    cleaning: tables.filter((t) => t.status === "CLEANING").length,
  };

  return (
    <div className="mx-auto max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-stone-900">
            <Users className="h-7 w-7 text-orange-600" />
            Manajemen Meja
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Kelola status meja untuk pelayan — real-time via WebSocket
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-green-500" : "bg-red-400"}`}
          />
          <span className="text-stone-500">
            {connected ? "Terhubung" : "Menghubungkan..."}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Total Meja"
          value={counts.total}
          color="text-stone-900"
        />
        <StatCard label="Kosong" value={counts.empty} color="text-stone-500" />
        <StatCard
          label="Terisi"
          value={counts.occupied}
          color="text-orange-600"
        />
        <StatCard
          label="Dipesan"
          value={counts.reserved}
          color="text-blue-600"
        />
        <StatCard
          label="Pembersihan"
          value={counts.cleaning}
          color="text-purple-600"
        />
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-stone-500">
        {(Object.keys(STATUS_CONFIG) as TableStatus[]).map((status) => (
          <span key={status} className="flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${STATUS_CONFIG[status].dot}`}
            />
            {STATUS_CONFIG[status].label}
          </span>
        ))}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {isPending && <p className="text-sm text-stone-500">Memperbarui...</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tables.length === 0 ? (
          <div className="col-span-full flex h-48 items-center justify-center text-stone-400">
            <p>Belum ada meja. Jalankan seed terlebih dahulu.</p>
          </div>
        ) : (
          tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onUpdateStatus={handleUpdateStatus}
              onReset={handleReset}
              disabled={isPending}
            />
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
      <p className="text-xs text-stone-500">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function TableCard({
  table,
  onUpdateStatus,
  onReset,
  disabled,
}: {
  table: TableView;
  onUpdateStatus: (id: string, status: TableStatus) => void;
  onReset: (id: string) => void;
  disabled: boolean;
}) {
  const config = STATUS_CONFIG[table.status];

  return (
    <div
      className={`rounded-2xl border-2 p-4 transition-colors ${config.color}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {config.icon}
          <div>
            <p className="text-lg font-bold text-stone-900">
              Meja {table.number}
            </p>
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${config.dot}`} />
              <span className="text-xs font-medium text-stone-600">
                {config.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {table.currentOrder && (
        <div className="mt-3 rounded-lg bg-white/60 p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-medium text-stone-700">
              {table.currentOrder.orderNumber}
            </span>
            <span className="font-semibold text-orange-600">
              {formatIDR(table.currentOrder.total)}
            </span>
          </div>
          <ul className="mt-1.5 space-y-0.5 text-stone-500">
            {table.currentOrder.items.map((item, i) => (
              <li
                key={`${item.productName}-${i}`}
                className="flex justify-between"
              >
                <span>{item.productName}</span>
                <span>x{item.quantity}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-stone-400">
            {new Date(table.currentOrder.createdAt).toLocaleTimeString("id-ID")}
          </p>
        </div>
      )}

      {table.activeTicket && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-600">
          <Clock className="h-3.5 w-3.5" />
          <span>Dapur: {ticketStatusLabel(table.activeTicket.status)}</span>
          <span className="text-stone-400">
            · {table.activeTicket.ticketNumber}
          </span>
        </div>
      )}

      <div className="mt-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {table.status !== "OCCUPIED" && (
            <ActionButton
              label="Terisi"
              onClick={() => onUpdateStatus(table.id, "OCCUPIED")}
              disabled={disabled}
              variant="orange"
            />
          )}
          {table.status !== "RESERVED" && (
            <ActionButton
              label="Pesan"
              onClick={() => onUpdateStatus(table.id, "RESERVED")}
              disabled={disabled}
              variant="blue"
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {table.status !== "CLEANING" && (
            <ActionButton
              label="Bersihkan"
              onClick={() => onUpdateStatus(table.id, "CLEANING")}
              disabled={disabled}
              variant="purple"
            />
          )}
          {table.status !== "EMPTY" && (
            <ActionButton
              label="Kosong"
              onClick={() => onReset(table.id)}
              disabled={disabled}
              variant="stone"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  variant,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  variant: "orange" | "blue" | "purple" | "stone";
}) {
  const variants: Record<string, string> = {
    orange: "bg-orange-600 text-white hover:bg-orange-700",
    blue: "bg-blue-600 text-white hover:bg-blue-700",
    purple: "bg-purple-600 text-white hover:bg-purple-700",
    stone: "bg-stone-200 text-stone-700 hover:bg-stone-300",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${variants[variant]}`}
    >
      {label}
    </button>
  );
}

function ticketStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Menunggu",
    PREPARING: "Dimasak",
    READY: "Siap",
    DONE: "Selesai",
  };
  return labels[status] ?? status;
}
