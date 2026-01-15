import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import * as Users from "./model/users";

export const list = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });
    return await ctx.db
      .query("people")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const add = mutation({
  args: { deviceId: v.string(), name: v.string() },
  handler: async (ctx, { deviceId, name }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });
    return await ctx.db.insert("people", {
      userId,
      name,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: { deviceId: v.string(), id: v.id("people"), name: v.string() },
  handler: async (ctx, { deviceId, id, name }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });

    // Verify ownership
    const person = await ctx.db.get(id);
    if (!person || person.userId !== userId) {
      throw new Error("Person not found");
    }

    await ctx.db.patch(id, { name });
  },
});

export const remove = mutation({
  args: { deviceId: v.string(), id: v.id("people") },
  handler: async (ctx, { deviceId, id }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });

    // Verify ownership
    const person = await ctx.db.get(id);
    if (!person || person.userId !== userId) {
      throw new Error("Person not found");
    }

    // Also remove all lending records for this person
    const lendings = await ctx.db
      .query("lending")
      .withIndex("by_person", (q) => q.eq("personId", id))
      .collect();

    for (const lending of lendings) {
      await ctx.db.delete(lending._id);
    }

    await ctx.db.delete(id);
  },
});
