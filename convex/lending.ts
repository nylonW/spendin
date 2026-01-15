import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import * as Users from "./model/users";

export const list = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });
    return await ctx.db
      .query("lending")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const getBalanceByPerson = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });
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
    deviceId: v.string(),
    personId: v.id("people"),
    amount: v.number(),
    note: v.optional(v.string()),
    date: v.string(),
  },
  handler: async (ctx, { deviceId, ...args }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });

    // Verify person belongs to user
    const person = await ctx.db.get(args.personId);
    if (!person || person.userId !== userId) {
      throw new Error("Person not found");
    }

    return await ctx.db.insert("lending", {
      ...args,
      userId,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { deviceId: v.string(), id: v.id("lending") },
  handler: async (ctx, { deviceId, id }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });

    // Verify ownership
    const lending = await ctx.db.get(id);
    if (!lending || lending.userId !== userId) {
      throw new Error("Lending record not found");
    }

    await ctx.db.delete(id);
  },
});
