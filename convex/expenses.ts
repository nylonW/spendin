import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("expenses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const listByType = query({
  args: { userId: v.id("users"), type: v.union(v.literal("one-time"), v.literal("recurring")) },
  handler: async (ctx, { userId, type }) => {
    return await ctx.db
      .query("expenses")
      .withIndex("by_user_type", (q) => q.eq("userId", userId).eq("type", type))
      .collect();
  },
});

export const listByDate = query({
  args: { userId: v.id("users"), date: v.string() },
  handler: async (ctx, { userId, date }) => {
    return await ctx.db
      .query("expenses")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .collect();
  },
});

export const listByDateRange = query({
  args: { userId: v.id("users"), startDate: v.string(), endDate: v.string() },
  handler: async (ctx, { userId, startDate, endDate }) => {
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
    userId: v.id("users"),
    name: v.string(),
    amount: v.number(),
    category: v.string(),
    type: v.union(v.literal("one-time"), v.literal("recurring")),
    date: v.string(),
    dayOfMonth: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("expenses", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("expenses"),
    name: v.optional(v.string()),
    amount: v.optional(v.number()),
    category: v.optional(v.string()),
    date: v.optional(v.string()),
    dayOfMonth: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filteredUpdates);
  },
});

export const remove = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
