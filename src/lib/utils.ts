import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type CurrencyCode = "USD" | "EUR" | "PLN";

const CURRENCY_LOCALES: Record<CurrencyCode, string> = {
  USD: "en-US",
  EUR: "de-DE",
  PLN: "pl-PL",
};

/**
 * Format a number as currency using the appropriate locale formatting
 * @param amount - The numeric amount to format
 * @param currency - The currency code (USD, EUR, PLN)
 * @param options - Optional formatting options
 * @returns Formatted currency string (e.g., "$1,000.00" or "1 000,00 zł")
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode | string,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  const locale = CURRENCY_LOCALES[currency as CurrencyCode] || "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(amount);
}

// Bill frequency types
export type BillFrequency = "monthly" | "bimonthly" | "quarterly" | "yearly";

export const BILL_FREQUENCIES: { value: BillFrequency; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "bimonthly", label: "Every 2 months" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

export const BILL_CATEGORIES = [
  "Utilities",
  "Housing",
  "Insurance",
  "Telecom",
  "Subscriptions",
  "Other",
];

/**
 * Get the current billing period for a bill based on its frequency
 */
export function getCurrentBillingPeriod(
  frequency: BillFrequency,
  referenceDate: Date = new Date()
): { start: string; end: string; label: string } {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  switch (frequency) {
    case "monthly": {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
        label: start.toLocaleDateString("en", { month: "long", year: "numeric" }),
      };
    }
    case "bimonthly": {
      const periodMonth = Math.floor(month / 2) * 2;
      const start = new Date(year, periodMonth, 1);
      const end = new Date(year, periodMonth + 2, 0);
      const startLabel = start.toLocaleDateString("en", { month: "short" });
      const endLabel = new Date(year, periodMonth + 1, 1).toLocaleDateString("en", { month: "short" });
      return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
        label: `${startLabel}-${endLabel} ${year}`,
      };
    }
    case "quarterly": {
      const quarter = Math.floor(month / 3);
      const start = new Date(year, quarter * 3, 1);
      const end = new Date(year, quarter * 3 + 3, 0);
      return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
        label: `Q${quarter + 1} ${year}`,
      };
    }
    case "yearly": {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
        label: String(year),
      };
    }
  }
}

/**
 * Check if a bill is paid for the given period
 */
export function isBillPaidForPeriod(
  payments: Array<{ periodStart: string; periodEnd: string }>,
  periodStart: string,
  periodEnd: string
): boolean {
  return payments.some(
    (p) => p.periodStart === periodStart && p.periodEnd === periodEnd
  );
}

/**
 * Calculate the deadline date for a billing period
 */
export function getDeadlineDate(periodStart: string, deadlineDay: number): string {
  const startDate = new Date(periodStart);
  const year = startDate.getFullYear();
  const month = startDate.getMonth();

  // Handle months with fewer days
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const actualDay = Math.min(deadlineDay, lastDayOfMonth);

  const deadlineDate = new Date(year, month, actualDay);
  return deadlineDate.toISOString().split("T")[0];
}

/**
 * Format a period label for display
 */
export function formatPeriodLabel(
  frequency: BillFrequency,
  periodStart: string
): string {
  const date = new Date(periodStart);
  const period = getCurrentBillingPeriod(frequency, date);
  return period.label;
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
export function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
