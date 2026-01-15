// ============================================
// Type Guards & Validation
// ============================================

/**
 * Type guard to check if a value is a valid Date object
 * Invalid dates (like new Date('invalid')) return false
 */
export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Safely create a Date from various inputs
 * Throws an error if the input cannot be parsed as a valid date
 */
export function safeCreateDate(input: string | number | Date): Date {
  const date = input instanceof Date ? new Date(input) : new Date(input);
  if (!isValidDate(date)) {
    throw new Error(`Cannot create valid date from: ${input}`);
  }
  return date;
}

/**
 * Create a Date from a timestamp (milliseconds since Unix epoch)
 * Handles both string and number timestamps
 */
export function fromTimestamp(timestamp: string | number): Date {
  const ms = typeof timestamp === "string" ? parseInt(timestamp, 10) : timestamp;
  if (isNaN(ms) || ms < 0) {
    throw new Error(`Invalid timestamp: ${timestamp}`);
  }
  return new Date(ms);
}

// ============================================
// Date Formatting (Storage/API - YYYY-MM-DD)
// ============================================

/**
 * Format date as YYYY-MM-DD string (using local timezone)
 * Use this for storage and API queries
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date as YYYY-MM-DD string in local timezone
 */
export function getToday(): string {
  return formatDateString(new Date());
}

// ============================================
// User-Facing Date Formatting (Intl.DateTimeFormat)
// ============================================

type DateStyle = "short" | "medium" | "long" | "full";

/**
 * Format a date for display to users using Intl.DateTimeFormat
 * Automatically handles localization and timezone
 */
export function formatDisplayDate(
  date: Date,
  options: {
    locale?: string;
    dateStyle?: DateStyle;
    includeTime?: boolean;
    timeStyle?: DateStyle;
    timeZone?: string;
  } = {}
): string {
  const {
    locale = "en-US",
    dateStyle = "medium",
    includeTime = false,
    timeStyle = "short",
    timeZone,
  } = options;

  const formatOptions: Intl.DateTimeFormatOptions = {
    dateStyle,
    ...(includeTime && { timeStyle }),
    ...(timeZone && { timeZone }),
  };

  return new Intl.DateTimeFormat(locale, formatOptions).format(date);
}

/**
 * Format just the weekday (e.g., "Mon", "Tuesday")
 */
export function formatWeekday(
  date: Date,
  style: "short" | "long" = "short",
  locale = "en-US"
): string {
  return new Intl.DateTimeFormat(locale, { weekday: style }).format(date);
}

/**
 * Format month and year (e.g., "January 2024")
 */
export function formatMonthYear(date: Date, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(date);
}

// ============================================
// Week Operations
// ============================================

/**
 * Get the Monday of the week containing the given date
 * Returns a new Date object (does not mutate input)
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date); // Create copy to avoid mutation
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get all 7 dates of the week starting from the given Monday
 * Returns new Date objects (does not mutate input)
 */
export function getWeekDates(weekStart: Date): Date[] {
  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart); // Create copy for each day
    d.setDate(weekStart.getDate() + i);
    week.push(d);
  }
  return week;
}

// ============================================
// Date Comparisons
// ============================================

/**
 * Check if a date is today (in local timezone)
 */
export function isToday(date: Date): boolean {
  return formatDateString(date) === formatDateString(new Date());
}

/**
 * Check if two dates represent the same day (ignoring time)
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return formatDateString(date1) === formatDateString(date2);
}

/**
 * Compare two dates for sorting
 * Returns negative if date1 < date2, 0 if equal, positive if date1 > date2
 */
export function compareDates(date1: Date, date2: Date): number {
  return date1.getTime() - date2.getTime();
}

/**
 * Check if date1 is before date2
 */
export function isBefore(date1: Date, date2: Date): boolean {
  return date1.getTime() < date2.getTime();
}

/**
 * Check if date1 is after date2
 */
export function isAfter(date1: Date, date2: Date): boolean {
  return date1.getTime() > date2.getTime();
}

// ============================================
// Date Arithmetic
// ============================================

/**
 * Add days to a date (returns new Date, does not mutate)
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add months to a date (returns new Date, does not mutate)
 * Handles month overflow correctly (e.g., Jan 31 + 1 month = Feb 28/29)
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const targetMonth = result.getMonth() + months;
  result.setMonth(targetMonth);

  // Handle overflow (e.g., Jan 31 -> Mar 3 should be Feb 28/29)
  if (result.getMonth() !== ((targetMonth % 12) + 12) % 12) {
    result.setDate(0); // Go to last day of previous month
  }
  return result;
}

/**
 * Get the number of days between two dates
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.round(diffMs / msPerDay);
}

// ============================================
// Month/Range Operations
// ============================================

/**
 * Get the first day of the month
 */
export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the last day of the month
 */
export function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Get month date range as YYYY-MM-DD strings
 */
export function getMonthRange(date: Date): { startDate: string; endDate: string } {
  return {
    startDate: formatDateString(getMonthStart(date)),
    endDate: formatDateString(getMonthEnd(date)),
  };
}
