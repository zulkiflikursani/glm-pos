"use client";

import { ChefHat, Clock, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import {
  getKitchenTickets,
  updateKitchenTicketStatus,
} from "@/app/kitchen/actions";
import type { KitchenTicketView, KitchenTicketStatus } from "@/types";

const STATUS_CONFIG: Record<
  KitchenTicketStatus,
  {
    label: string;
    color: string;
    next?: KitchenTicketStatus;
    nextLabel?: string;
  }
> = {
  PENDING: {
    label: "Menunggu",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    next: "PREPARING",
    nextLabel: "Mulai Masak",
  },
  PREPARING: {
    label: "Dimasak",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    next: "READY",
    nextLabel: "Siap",
  },
  READY: {
    label: "Siap Antar",
    color: "bg-green-100 text-green-800 border-green-200",
    next: "DONE",
    nextLabel: "Selesai",
  },
  DONE: {
    label: "Selesai",
    color: "bg-stone-100 text-stone-500 border-stone-200",
  },
};

type KitchenDisplayProps = {
  initialTickets: KitchenTicketView[];
};

export function KitchenDisplay({ initialTickets }: KitchenDisplayProps) {
  const router = useRouter();
  const [tickets, setTickets] = useState(initialTickets);
  const [isPending, startTransition] = useTransition();
  const [connected, setConnected] = useState(false);

  const refresh = useCallback(async () => {
    const data = await getKitchenTickets(true);
    setTickets(data);
  }, []);

  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

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

  const handleStatus = (ticketId: string, status: KitchenTicketStatus) => {
    startTransition(async () => {
      const result = await updateKitchenTicketStatus(ticketId, status);
      if (result.success) {
        await refresh();
        router.refresh();
      }
    });
  };

  const pending = tickets.filter((t) => t.status === "PENDING");
  const preparing = tickets.filter((t) => t.status === "PREPARING");
  const ready = tickets.filter((t) => t.status === "READY");

  return (
    <div className="mx-auto max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-stone-900">
            <ChefHat className="h-7 w-7 text-orange-600" />
            Dapur
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Kitchen Ticket System — real-time via WebSocket
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

      {isPending && <p className="text-sm text-stone-500">Memperbarui...</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <TicketColumn
          title="Menunggu"
          icon={<Clock className="h-5 w-5 text-yellow-600" />}
          tickets={pending}
          onStatus={handleStatus}
        />
        <TicketColumn
          title="Sedang Dimasak"
          icon={<ChefHat className="h-5 w-5 text-blue-600" />}
          tickets={preparing}
          onStatus={handleStatus}
        />
        <TicketColumn
          title="Siap Antar"
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          tickets={ready}
          onStatus={handleStatus}
        />
      </div>
    </div>
  );
}

type TicketColumnProps = {
  title: string;
  icon: ReactNode;
  tickets: KitchenTicketView[];
  onStatus: (id: string, status: KitchenTicketStatus) => void;
};

function TicketColumn({ title, icon, tickets, onStatus }: TicketColumnProps) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h2 className="font-bold text-stone-900">{title}</h2>
        <span className="ml-auto rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-600">
          {tickets.length}
        </span>
      </div>

      <div className="space-y-3">
        {tickets.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">Kosong</p>
        ) : (
          tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onStatus={onStatus} />
          ))
        )}
      </div>
    </div>
  );
}

type TicketCardProps = {
  ticket: KitchenTicketView;
  onStatus: (id: string, status: KitchenTicketStatus) => void;
};

function TicketCard({ ticket, onStatus }: TicketCardProps) {
  const config = STATUS_CONFIG[ticket.status];

  return (
    <div className={`rounded-xl border p-4 ${config.color}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold">{ticket.ticketNumber}</p>
          <p className="text-xs opacity-75">
            {ticket.orderNumber}
            {ticket.tableNumber ? ` · Meja ${ticket.tableNumber}` : ""}
          </p>
          <p className="mt-1 text-xs opacity-60">
            {new Date(ticket.createdAt).toLocaleTimeString("id-ID")}
          </p>
        </div>
        <span className="rounded-full bg-white/60 px-2 py-0.5 text-xs font-medium">
          {config.label}
        </span>
      </div>

      <ul className="mt-3 space-y-1 text-sm">
        {ticket.items.map((item, i) => (
          <li key={`${item.productName}-${i}`} className="flex justify-between">
            <span>{item.productName}</span>
            <span className="font-semibold">x{item.quantity}</span>
          </li>
        ))}
      </ul>

      {config.next && config.nextLabel && (
        <button
          type="button"
          onClick={() => onStatus(ticket.id, config.next!)}
          className="mt-3 w-full rounded-lg bg-white/80 py-2 text-sm font-semibold hover:bg-white"
        >
          {config.nextLabel}
        </button>
      )}
    </div>
  );
}
