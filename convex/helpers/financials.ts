import type { QueryCtx } from "../_generated/server";
import type { Id, Doc } from "../_generated/dataModel";

/**
 * Financial calculation helpers for consistent spending/income aggregation.
 * These are internal functions used by Convex queries.
 */

export interface SpendingBreakdown {
  oneTimeExpenses: Doc<"expenses">[];
  recurringExpenses: Doc<"expenses">[];
  billPayments: Doc<"expenses">[];
  lendingOut: Doc<"lending">[];
  totals: {
    oneTime: number;
    recurring: number;
    bills: number;
    lending: number;
    total: number;
  };
  byCategory: Record<string, number>;
}

export interface IncomeBreakdown {
  baseSalary: number;
  savings: number;
  recurringIncome: Doc<"additionalIncome">[];
  oneTimeIncome: Doc<"additionalIncome">[];
  lendingRepayments: Doc<"lending">[];
  totals: {
    salary: number;
    recurring: number;
    oneTime: number;
    lendingRepaid: number;
    total: number;
  };
}

export interface MonthlyFinancialSummary {
  spending: SpendingBreakdown;
  income: IncomeBreakdown;
  netBalance: number;
  remaining: number; // income.total - spending.total
}

/**
 * Get all spending data for a date range.
 * Includes: one-time expenses, recurring expenses, bill payments, and lending out.
 */
export async function getSpendingForPeriod(
  ctx: QueryCtx,
  userId: Id<"users">,
  startDate: string,
  endDate: string
): Promise<SpendingBreakdown> {
  // Get all expenses for this user
  const allExpenses = await ctx.db
    .query("expenses")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  // Get lending transactions
  const allLending = await ctx.db
    .query("lending")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  // Filter expenses by type and date
  const oneTimeExpenses = allExpenses.filter(
    (e) => e.type === "one-time" && !e.billId && e.date >= startDate && e.date <= endDate
  );

  const recurringExpenses = allExpenses.filter((e) => e.type === "recurring");

  const billPayments = allExpenses.filter(
    (e) => e.billId && e.date >= startDate && e.date <= endDate
  );

  // Lending out (positive amounts = money lent to others)
  const lendingOut = allLending.filter(
    (l) => l.amount > 0 && l.date >= startDate && l.date <= endDate
  );

  // Calculate totals
  const oneTimeTotal = oneTimeExpenses.reduce((sum, e) => sum + e.amount, 0);
  const recurringTotal = recurringExpenses.reduce((sum, e) => sum + e.amount, 0);
  const billsTotal = billPayments.reduce((sum, e) => sum + e.amount, 0);
  const lendingTotal = lendingOut.reduce((sum, l) => sum + l.amount, 0);

  // Calculate by category
  const byCategory: Record<string, number> = {};

  for (const exp of oneTimeExpenses) {
    byCategory[exp.category] = (byCategory[exp.category] ?? 0) + exp.amount;
  }

  for (const exp of recurringExpenses) {
    byCategory["Subscriptions"] = (byCategory["Subscriptions"] ?? 0) + exp.amount;
  }

  for (const exp of billPayments) {
    byCategory[exp.category] = (byCategory[exp.category] ?? 0) + exp.amount;
  }

  if (lendingTotal > 0) {
    byCategory["Lending"] = lendingTotal;
  }

  return {
    oneTimeExpenses,
    recurringExpenses,
    billPayments,
    lendingOut,
    totals: {
      oneTime: oneTimeTotal,
      recurring: recurringTotal,
      bills: billsTotal,
      lending: lendingTotal,
      total: oneTimeTotal + recurringTotal + billsTotal + lendingTotal,
    },
    byCategory,
  };
}

/**
 * Get all income data for a date range.
 * Includes: base salary, recurring income, one-time income, and lending repayments.
 */
export async function getIncomeForPeriod(
  ctx: QueryCtx,
  userId: Id<"users">,
  startDate: string,
  endDate: string
): Promise<IncomeBreakdown> {
  // Get base income (salary, savings)
  const income = await ctx.db
    .query("income")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  const baseSalary = income?.salary ?? 0;
  const savings = income?.savings ?? 0;

  // Get additional income
  const allAdditionalIncome = await ctx.db
    .query("additionalIncome")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  // Get lending transactions
  const allLending = await ctx.db
    .query("lending")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  // Filter income by type and date
  const recurringIncome = allAdditionalIncome.filter((i) => i.type === "recurring");

  const oneTimeIncome = allAdditionalIncome.filter(
    (i) => i.type === "one-time" && i.date >= startDate && i.date <= endDate
  );

  // Lending repayments (negative amounts = money paid back to you)
  const lendingRepayments = allLending.filter(
    (l) => l.amount < 0 && l.date >= startDate && l.date <= endDate
  );

  // Calculate totals
  const recurringTotal = recurringIncome.reduce((sum, i) => sum + i.amount, 0);
  const oneTimeTotal = oneTimeIncome.reduce((sum, i) => sum + i.amount, 0);
  const lendingRepaidTotal = Math.abs(lendingRepayments.reduce((sum, l) => sum + l.amount, 0));

  return {
    baseSalary,
    savings,
    recurringIncome,
    oneTimeIncome,
    lendingRepayments,
    totals: {
      salary: baseSalary,
      recurring: recurringTotal,
      oneTime: oneTimeTotal,
      lendingRepaid: lendingRepaidTotal,
      total: baseSalary + recurringTotal + oneTimeTotal + lendingRepaidTotal,
    },
  };
}

/**
 * Get complete monthly financial summary.
 * Combines spending and income breakdowns with net calculations.
 */
export async function getMonthlyFinancialSummary(
  ctx: QueryCtx,
  userId: Id<"users">,
  startDate: string,
  endDate: string
): Promise<MonthlyFinancialSummary> {
  const spending = await getSpendingForPeriod(ctx, userId, startDate, endDate);
  const income = await getIncomeForPeriod(ctx, userId, startDate, endDate);

  const remaining = income.totals.total - spending.totals.total;
  const netBalance = remaining - income.savings; // After savings

  return {
    spending,
    income,
    netBalance,
    remaining,
  };
}

/**
 * Get daily spending total for a specific date.
 * Used for week calendar view - includes recurring expenses that fall on that day.
 */
export async function getDailySpendingTotal(
  ctx: QueryCtx,
  userId: Id<"users">,
  date: string
): Promise<number> {
  const dateObj = new Date(date + "T00:00:00");
  const dayOfMonth = dateObj.getDate();
  const dateYear = dateObj.getFullYear();
  const dateMonth = dateObj.getMonth();

  // Get all expenses
  const allExpenses = await ctx.db
    .query("expenses")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  // Get lending for this date
  const allLending = await ctx.db
    .query("lending")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  let total = 0;

  // One-time expenses for this date (including bill payments)
  const oneTimeForDate = allExpenses.filter((e) => e.type === "one-time" && e.date === date);
  total += oneTimeForDate.reduce((sum, e) => sum + e.amount, 0);

  // Recurring expenses that fall on this day
  const recurringExpenses = allExpenses.filter((e) => e.type === "recurring");
  for (const e of recurringExpenses) {
    const createdDate = new Date(e.createdAt);
    const createdYear = createdDate.getFullYear();
    const createdMonth = createdDate.getMonth();
    const createdDay = createdDate.getDate();
    const createdDateStr = `${createdYear}-${String(createdMonth + 1).padStart(2, "0")}-${String(createdDay).padStart(2, "0")}`;

    let shouldInclude = false;

    // Show on the day it was created (first occurrence)
    if (createdDateStr === date) {
      shouldInclude = true;
    } else if (e.dayOfMonth === dayOfMonth) {
      // Show on the dayOfMonth for months after creation
      if (dateYear > createdYear || (dateYear === createdYear && dateMonth > createdMonth)) {
        shouldInclude = true;
      } else if (dateYear === createdYear && dateMonth === createdMonth) {
        shouldInclude = createdDay <= e.dayOfMonth && dateObj >= createdDate;
      }
    }

    if (shouldInclude) {
      total += e.amount;
    }
  }

  // Lending out for this date
  const lendingForDate = allLending.filter((l) => l.date === date && l.amount > 0);
  total += lendingForDate.reduce((sum, l) => sum + l.amount, 0);

  return total;
}
