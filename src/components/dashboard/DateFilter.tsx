"use client";

import { Calendar } from "lucide-react";

type DateFilterProps = {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onToday: () => void;
};

export function DateFilter({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onToday,
}: DateFilterProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
      <div className="flex-1">
        <label
          htmlFor="date-from"
          className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-stone-700"
        >
          <Calendar className="h-4 w-4" />
          Dari Tanggal
        </label>
        <input
          id="date-from"
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none ring-orange-500 focus:ring-2"
        />
      </div>
      <div className="flex-1">
        <label
          htmlFor="date-to"
          className="mb-1.5 block text-sm font-medium text-stone-700"
        >
          Sampai Tanggal
        </label>
        <input
          id="date-to"
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none ring-orange-500 focus:ring-2"
        />
      </div>
      <button
        type="button"
        onClick={onToday}
        className="rounded-xl bg-stone-100 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-200"
      >
        Hari Ini
      </button>
    </div>
  );
}
