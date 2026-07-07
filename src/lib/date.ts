export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDateRange(dateFrom: string, dateTo: string) {
  const start = new Date(`${dateFrom}T00:00:00`);
  const end = new Date(`${dateTo}T23:59:59.999`);
  return { start, end };
}

export function getTodayRange() {
  const today = toDateInputValue(new Date());
  return getDateRange(today, today);
}
