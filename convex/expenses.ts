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

export const listByDate = query({
  args: { deviceId: v.string(), date: v.string() },
  handler: async (ctx, { deviceId, date }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });
    return await ctx.db
      .query("expenses")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .collect();
  },
});

export const listByDateRange = query({
  args: { deviceId: v.string(), startDate: v.string(), endDate: v.string() },
  handler: async (ctx, { deviceId, startDate, endDate }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });
    const all = await ctx.db
      .query("expenses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return all.filter((e) => {
      if (e.type === "recurring") return true;
      return e.date >= startDate && e.date <= endDate;
    });
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

export const update = mutation({
  args: {
    deviceId: v.string(),
    id: v.id("expenses"),
    name: v.optional(v.string()),
    amount: v.optional(v.number()),
    category: v.optional(v.string()),
    date: v.optional(v.string()),
    dayOfMonth: v.optional(v.number()),
  },
  handler: async (ctx, { deviceId, id, ...updates }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });

    // Verify ownership
    const expense = await ctx.db.get(id);
    if (!expense || expense.userId !== userId) {
      throw new Error("Expense not found");
    }

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filteredUpdates);
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
