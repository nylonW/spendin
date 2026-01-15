import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import * as Users from "./model/users";

export const list = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });
    return await ctx.db
      .query("additionalIncome")
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
      .query("additionalIncome")
      .withIndex("by_user_type", (q) => q.eq("userId", userId).eq("type", type))
      .collect();
  },
});

export const listByDateRange = query({
  args: { deviceId: v.string(), startDate: v.string(), endDate: v.string() },
  handler: async (ctx, { deviceId, startDate, endDate }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });
    const all = await ctx.db
      .query("additionalIncome")
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
    source: v.string(),
    type: v.union(v.literal("one-time"), v.literal("recurring")),
    date: v.string(),
    dayOfMonth: v.optional(v.number()),
  },
  handler: async (ctx, { deviceId, ...args }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });
    return await ctx.db.insert("additionalIncome", {
      ...args,
      userId,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    deviceId: v.string(),
    id: v.id("additionalIncome"),
    name: v.optional(v.string()),
    amount: v.optional(v.number()),
    source: v.optional(v.string()),
    date: v.optional(v.string()),
    dayOfMonth: v.optional(v.number()),
  },
  handler: async (ctx, { deviceId, id, ...updates }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });

    // Verify ownership
    const income = await ctx.db.get(id);
    if (!income || income.userId !== userId) {
      throw new Error("Income not found");
    }

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filteredUpdates);
  },
});

export const remove = mutation({
  args: { deviceId: v.string(), id: v.id("additionalIncome") },
  handler: async (ctx, { deviceId, id }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });

    // Verify ownership
    const income = await ctx.db.get(id);
    if (!income || income.userId !== userId) {
      throw new Error("Income not found");
    }

    await ctx.db.delete(id);
  },
});
