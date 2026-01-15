import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("income")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

export const upsert = mutation({
  args: {
    userId: v.id("users"),
    salary: v.optional(v.number()),
    savings: v.optional(v.number()),
  },
  handler: async (ctx, { userId, salary, savings }) => {
    const existing = await ctx.db
      .query("income")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      const updates: { salary?: number; savings?: number; updatedAt: number } = {
        updatedAt: Date.now(),
      };
      if (salary !== undefined) updates.salary = salary;
      if (savings !== undefined) updates.savings = savings;
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    return await ctx.db.insert("income", {
      userId,
      salary: salary ?? 0,
      savings: savings ?? 0,
      updatedAt: Date.now(),
    });
  },
});
