import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("lending")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const listByPerson = query({
  args: { personId: v.id("people") },
  handler: async (ctx, { personId }) => {
    return await ctx.db
      .query("lending")
      .withIndex("by_person", (q) => q.eq("personId", personId))
      .collect();
  },
});

export const getBalanceByPerson = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const lendings = await ctx.db
      .query("lending")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const balances: Record<string, number> = {};
    for (const lending of lendings) {
      const personId = lending.personId;
      if (!balances[personId]) {
        balances[personId] = 0;
      }
      balances[personId] += lending.amount;
    }

    return balances;
  },
});

export const add = mutation({
  args: {
    userId: v.id("users"),
    personId: v.id("people"),
    amount: v.number(),
    note: v.optional(v.string()),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("lending", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("lending") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
