import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import * as Users from "./model/users";

export const list = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });
    return await ctx.db
      .query("bills")
      .withIndex("by_user_active", (q) => q.eq("userId", userId).eq("isActive", true))
      .collect();
  },
});

export const listAll = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });
    return await ctx.db
      .query("bills")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const add = mutation({
  args: {
    deviceId: v.string(),
    name: v.string(),
    category: v.string(),
    frequency: v.string(),
    expectedAmount: v.optional(v.number()),
    deadlineDay: v.optional(v.number()),
    reminderDaysBefore: v.optional(v.number()),
  },
  handler: async (ctx, { deviceId, ...args }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });
    return await ctx.db.insert("bills", {
      ...args,
      userId,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    deviceId: v.string(),
    id: v.id("bills"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    frequency: v.optional(v.string()),
    expectedAmount: v.optional(v.number()),
    deadlineDay: v.optional(v.number()),
    reminderDaysBefore: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { deviceId, id, ...updates }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });

    // Verify ownership
    const bill = await ctx.db.get(id);
    if (!bill || bill.userId !== userId) {
      throw new Error("Bill not found");
    }

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filteredUpdates);
  },
});

export const remove = mutation({
  args: { deviceId: v.string(), id: v.id("bills") },
  handler: async (ctx, { deviceId, id }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });

    // Verify ownership
    const bill = await ctx.db.get(id);
    if (!bill || bill.userId !== userId) {
      throw new Error("Bill not found");
    }

    // Delete all associated payment expenses (expenses with this billId)
    const paymentExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_bill", (q) => q.eq("billId", id))
      .collect();
    for (const expense of paymentExpenses) {
      await ctx.db.delete(expense._id);
    }

    await ctx.db.delete(id);
  },
});

// Soft delete - just deactivate
export const deactivate = mutation({
  args: { deviceId: v.string(), id: v.id("bills") },
  handler: async (ctx, { deviceId, id }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });

    const bill = await ctx.db.get(id);
    if (!bill || bill.userId !== userId) {
      throw new Error("Bill not found");
    }

    await ctx.db.patch(id, { isActive: false });
  },
});

// Get payments for a specific bill (now queries expenses with billId)
export const getPayments = query({
  args: { deviceId: v.string(), billId: v.id("bills") },
  handler: async (ctx, { deviceId, billId }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });

    // Verify ownership
    const bill = await ctx.db.get(billId);
    if (!bill || bill.userId !== userId) {
      throw new Error("Bill not found");
    }

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_bill", (q) => q.eq("billId", billId))
      .collect();

    // Return in payment-like format for compatibility
    return expenses.map((e) => ({
      _id: e._id,
      _creationTime: e._creationTime,
      userId: e.userId,
      billId: e.billId,
      amount: e.amount,
      periodStart: e.periodStart ?? "",
      periodEnd: e.periodEnd ?? "",
      paidAt: e.date,
      createdAt: e.createdAt,
    }));
  },
});

// Get all bill payments for user (queries expenses with billId set)
export const getAllPayments = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Filter to only expenses that are bill payments and return in payment-like format
    return expenses
      .filter((e) => e.billId)
      .map((e) => ({
        _id: e._id,
        _creationTime: e._creationTime,
        userId: e.userId,
        billId: e.billId,
        amount: e.amount,
        periodStart: e.periodStart ?? "",
        periodEnd: e.periodEnd ?? "",
        paidAt: e.date,
        createdAt: e.createdAt,
      }));
  },
});

// Add a bill payment (creates an expense with billId)
export const addPayment = mutation({
  args: {
    deviceId: v.string(),
    billId: v.id("bills"),
    amount: v.number(),
    periodStart: v.string(),
    periodEnd: v.string(),
    paidAt: v.string(),
  },
  handler: async (ctx, { deviceId, billId, amount, periodStart, periodEnd, paidAt }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });

    // Verify bill ownership
    const bill = await ctx.db.get(billId);
    if (!bill || bill.userId !== userId) {
      throw new Error("Bill not found");
    }

    // Check if already paid for this period (check expenses with this billId)
    const existingPayments = await ctx.db
      .query("expenses")
      .withIndex("by_bill", (q) => q.eq("billId", billId))
      .collect();

    const alreadyPaid = existingPayments.some(
      (p) => p.periodStart === periodStart && p.periodEnd === periodEnd
    );

    if (alreadyPaid) {
      throw new Error("Bill already paid for this period");
    }

    // Create expense with billId
    return await ctx.db.insert("expenses", {
      userId,
      name: bill.name,
      amount,
      category: bill.category,
      type: "one-time",
      date: paidAt,
      billId,
      periodStart,
      periodEnd,
      createdAt: Date.now(),
    });
  },
});

// Remove a bill payment (deletes the expense)
export const removePayment = mutation({
  args: { deviceId: v.string(), id: v.id("expenses") },
  handler: async (ctx, { deviceId, id }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });

    const expense = await ctx.db.get(id);
    if (!expense || expense.userId !== userId) {
      throw new Error("Payment not found");
    }

    // Verify this is actually a bill payment
    if (!expense.billId) {
      throw new Error("This is not a bill payment");
    }

    await ctx.db.delete(id);
  },
});

// Get bills with their payment status for current period
export const listWithStatus = query({
  args: { deviceId: v.string(), currentDate: v.string() },
  handler: async (ctx, { deviceId, currentDate }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });

    const bills = await ctx.db
      .query("bills")
      .withIndex("by_user_active", (q) => q.eq("userId", userId).eq("isActive", true))
      .collect();

    // Get all expenses that are bill payments
    const allExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const billPayments = allExpenses.filter((e) => e.billId);

    // Group payments by bill
    const paymentsByBill = new Map<string, typeof billPayments>();
    for (const payment of billPayments) {
      if (!payment.billId) continue;
      const payments = paymentsByBill.get(payment.billId) ?? [];
      payments.push(payment);
      paymentsByBill.set(payment.billId, payments);
    }

    return bills.map((bill) => {
      const payments = paymentsByBill.get(bill._id) ?? [];
      // Sort payments by periodStart descending to get latest first
      const sortedPayments = [...payments].sort(
        (a, b) => new Date(b.periodStart ?? "").getTime() - new Date(a.periodStart ?? "").getTime()
      );

      // Map to payment-like format for compatibility
      const formattedPayments = sortedPayments.map((e) => ({
        _id: e._id,
        _creationTime: e._creationTime,
        userId: e.userId,
        billId: e.billId,
        amount: e.amount,
        periodStart: e.periodStart ?? "",
        periodEnd: e.periodEnd ?? "",
        paidAt: e.date,
        createdAt: e.createdAt,
      }));

      const latestPayment = formattedPayments[0];
      const previousPayment = formattedPayments[1];

      // Calculate trend
      let trend: { direction: "up" | "down" | "same"; percentage: number } | null = null;
      if (latestPayment && previousPayment) {
        const diff = latestPayment.amount - previousPayment.amount;
        const percentage = Math.round((Math.abs(diff) / previousPayment.amount) * 100);
        trend = {
          direction: diff > 0 ? "up" : diff < 0 ? "down" : "same",
          percentage,
        };
      }

      return {
        ...bill,
        payments: formattedPayments,
        latestPayment,
        trend,
      };
    });
  },
});

// Get unpaid bills that are approaching their deadline
export const getUnpaidWithUpcomingDeadlines = query({
  args: { deviceId: v.string(), currentDate: v.string() },
  handler: async (ctx, { deviceId, currentDate }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });
    const today = new Date(currentDate);

    const bills = await ctx.db
      .query("bills")
      .withIndex("by_user_active", (q) => q.eq("userId", userId).eq("isActive", true))
      .collect();

    // Get all expenses that are bill payments
    const allExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const billPayments = allExpenses.filter((e) => e.billId);

    // Group payments by bill
    const paymentsByBill = new Map<string, typeof billPayments>();
    for (const payment of billPayments) {
      if (!payment.billId) continue;
      const payments = paymentsByBill.get(payment.billId) ?? [];
      payments.push(payment);
      paymentsByBill.set(payment.billId, payments);
    }

    const unpaidBillsWithDeadlines: Array<{
      bill: (typeof bills)[0];
      deadlineDate: string;
      daysUntilDeadline: number;
      periodStart: string;
      periodEnd: string;
    }> = [];

    for (const bill of bills) {
      // Skip bills without deadlines
      if (!bill.deadlineDay) continue;

      const payments = paymentsByBill.get(bill._id) ?? [];

      // Calculate current period based on frequency
      const period = getCurrentPeriod(bill.frequency, today);
      if (!period) continue;

      // Check if paid for current period
      const isPaid = payments.some(
        (p) => p.periodStart === period.start && p.periodEnd === period.end
      );

      if (isPaid) continue;

      // Calculate deadline date for current period
      const deadlineDate = getDeadlineDateForPeriod(period.start, bill.deadlineDay);
      const daysUntilDeadline = Math.ceil(
        (new Date(deadlineDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      const reminderDays = bill.reminderDaysBefore ?? 3;

      // Show warning if within reminder window or past deadline
      if (daysUntilDeadline <= reminderDays) {
        unpaidBillsWithDeadlines.push({
          bill,
          deadlineDate,
          daysUntilDeadline,
          periodStart: period.start,
          periodEnd: period.end,
        });
      }
    }

    // Sort by deadline (most urgent first)
    return unpaidBillsWithDeadlines.sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline);
  },
});

// Helper function to calculate current billing period
function getCurrentPeriod(
  frequency: string,
  date: Date
): { start: string; end: string } | null {
  const year = date.getFullYear();
  const month = date.getMonth();

  switch (frequency) {
    case "monthly": {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      };
    }
    case "bimonthly": {
      // Bi-monthly periods: Jan-Feb, Mar-Apr, May-Jun, Jul-Aug, Sep-Oct, Nov-Dec
      const periodMonth = Math.floor(month / 2) * 2;
      const start = new Date(year, periodMonth, 1);
      const end = new Date(year, periodMonth + 2, 0);
      return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      };
    }
    case "quarterly": {
      const quarter = Math.floor(month / 3);
      const start = new Date(year, quarter * 3, 1);
      const end = new Date(year, quarter * 3 + 3, 0);
      return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      };
    }
    case "yearly": {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      };
    }
    default:
      return null;
  }
}

// Helper to get deadline date for a period
function getDeadlineDateForPeriod(periodStart: string, deadlineDay: number): string {
  const startDate = new Date(periodStart);
  const year = startDate.getFullYear();
  const month = startDate.getMonth();

  // Get the last day of the period's first month
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const actualDay = Math.min(deadlineDay, lastDayOfMonth);

  const deadlineDate = new Date(year, month, actualDay);
  return deadlineDate.toISOString().split("T")[0];
}
