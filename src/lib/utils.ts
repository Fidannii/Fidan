import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEuro(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPhone(value: string | null | undefined): string {
  if (!value) return "—";
  return value;
}

export function intentLabel(intent: string | null | undefined): string {
  switch (intent) {
    case "buy":
      return "Kauf";
    case "rent":
      return "Miete";
    case "sell":
      return "Verkauf";
    case "finance":
      return "Finanzierung";
    case "other":
      return "Sonstiges";
    default:
      return "Offen";
  }
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    new: "Neu",
    qualified: "Qualifiziert",
    contacted: "Kontaktiert",
    appointment: "Termin",
    won: "Gewonnen",
    lost: "Verloren",
    spam: "Spam",
  };
  return map[status] ?? status;
}
