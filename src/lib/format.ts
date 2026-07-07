export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function parseIDRInput(value: string): number {
  const digits = value.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}
