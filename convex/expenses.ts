import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import * as Users from "./model/users";

export const list = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });
    return await ctx.db
      .query("expenses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const listByType = query({
  args: {
    deviceId: v.string(),
    type: v.union(v.literal("one-time"), v.literal("recurring")),
  },
  handler: async (ctx, { deviceId, type }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });
    return await ctx.db
      .query("expenses")
      .withIndex("by_user_type", (q) => q.eq("userId", userId).eq("type", type))
      .collect();
  },
});

export const add = mutation({
  args: {
    deviceId: v.string(),
    name: v.string(),
    amount: v.number(),
    category: v.string(),
    type: v.union(v.literal("one-time"), v.literal("recurring")),
    date: v.string(),
    dayOfMonth: v.optional(v.number()),
  },
  handler: async (ctx, { deviceId, ...args }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });
    return await ctx.db.insert("expenses", {
      ...args,
      userId,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { deviceId: v.string(), id: v.id("expenses") },
  handler: async (ctx, { deviceId, id }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });

    // Verify ownership
    const expense = await ctx.db.get(id);
    if (!expense || expense.userId !== userId) {
      throw new Error("Expense not found");
    }

    await ctx.db.delete(id);
  },
});

// Get day totals for a week range (expenses + lendings)
export const getWeekTotals = query({
  args: { deviceId: v.string(), startDate: v.string(), endDate: v.string() },
  handler: async (ctx, { deviceId, startDate, endDate }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });

    // Get all expenses for this user
    const allExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get lendings in date range
    const lendings = await ctx.db
      .query("lending")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const lendingsInRange = lendings.filter((l) => l.date >= startDate && l.date <= endDate && l.amount > 0);

    // Build totals map for each day
    const totals: Record<string, number> = {};

    // Add one-time expenses
    for (const e of allExpenses) {
      if (e.type === "one-time" && e.date >= startDate && e.date <= endDate) {
        totals[e.date] = (totals[e.date] ?? 0) + e.amount;
      }
    }

    // Add recurring expenses for each day in range
    const recurringExpenses = allExpenses.filter((e) => e.type === "recurring");
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dayOfMonth = d.getDate();

      for (const e of recurringExpenses) {
        const createdDate = new Date(e.createdAt);
        const createdYear = createdDate.getFullYear();
        const createdMonth = createdDate.getMonth();
        const createdDay = createdDate.getDate();
        const createdDateStr = `${createdYear}-${String(createdMonth + 1).padStart(2, "0")}-${String(createdDay).padStart(2, "0")}`;

        let shouldInclude = false;
        if (createdDateStr === dateStr) {
          shouldInclude = true;
        } else if (e.dayOfMonth === dayOfMonth) {
          const dateYear = d.getFullYear();
          const dateMonth = d.getMonth();
          if (dateYear > createdYear || (dateYear === createdYear && dateMonth > createdMonth)) {
            shouldInclude = true;
          } else if (dateYear === createdYear && dateMonth === createdMonth) {
            shouldInclude = createdDay <= e.dayOfMonth && d >= createdDate;
          }
        }

        if (shouldInclude) {
          totals[dateStr] = (totals[dateStr] ?? 0) + e.amount;
        }
      }
    }

    // Add lendings
    for (const l of lendingsInRange) {
      totals[l.date] = (totals[l.date] ?? 0) + l.amount;
    }

    return totals;
  },
});

// Combined query for all spending on a specific date
export const getSpendingForDate = query({
  args: { deviceId: v.string(), date: v.string() },
  handler: async (ctx, { deviceId, date }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });

    const dateObj = new Date(date + "T00:00:00");
    const dayOfMonth = dateObj.getDate();
    const dateYear = dateObj.getFullYear();
    const dateMonth = dateObj.getMonth();

    // Get one-time expenses for this date
    const oneTimeExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .collect();

    // Get all recurring expenses and filter for this day
    const allRecurring = await ctx.db
      .query("expenses")
      .withIndex("by_user_type", (q) => q.eq("userId", userId).eq("type", "recurring"))
      .collect();

    const recurringForDate = allRecurring.filter((e) => {
      const createdDate = new Date(e.createdAt);
      const createdYear = createdDate.getFullYear();
      const createdMonth = createdDate.getMonth();
      const createdDay = createdDate.getDate();

      // Format created date as YYYY-MM-DD for comparison
      const createdDateStr = `${createdYear}-${String(createdMonth + 1).padStart(2, "0")}-${String(createdDay).padStart(2, "0")}`;

      // Show on the day it was created (first occurrence)
      if (createdDateStr === date) return true;

      // Show on the dayOfMonth for months after creation
      if (e.dayOfMonth === dayOfMonth) {
        if (dateYear > createdYear || (dateYear === createdYear && dateMonth > createdMonth)) {
          return true;
        }
        if (dateYear === createdYear && dateMonth === createdMonth) {
          return createdDay <= e.dayOfMonth && dateObj >= createdDate;
        }
      }
      return false;
    });

    // Get lendings for this date
    const lendings = await ctx.db
      .query("lending")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const lendingsForDate = lendings.filter((l) => l.date === date && l.amount > 0);

    // Get person names for lendings
    const personIds = [...new Set(lendingsForDate.map((l) => l.personId))];
    const people = await Promise.all(personIds.map((id) => ctx.db.get(id)));
    const peopleMap = new Map(people.filter(Boolean).map((p) => [p!._id, p!.name]));

    // Build unified spending items array
    type SpendingItem =
      | { type: "expense"; id: string; name: string; amount: number; category: string }
      | { type: "recurring"; id: string; name: string; amount: number; category: string; dayOfMonth: number }
      | { type: "lending"; id: string; name: string; amount: number; personName: string };

    const items: SpendingItem[] = [
      ...oneTimeExpenses
        .filter((e) => e.type === "one-time")
        .map((e) => ({
          type: "expense" as const,
          id: e._id,
          name: e.name,
          amount: e.amount,
          category: e.category,
        })),
      ...recurringForDate.map((e) => ({
        type: "recurring" as const,
        id: e._id,
        name: e.name,
        amount: e.amount,
        category: e.category,
        dayOfMonth: e.dayOfMonth ?? 1,
      })),
      ...lendingsForDate.map((l) => ({
        type: "lending" as const,
        id: l._id,
        name: l.note || "Lent money",
        amount: l.amount,
        personName: peopleMap.get(l.personId) ?? "Unknown",
      })),
    ];

    return items;
  },
});
