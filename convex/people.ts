import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("people")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const add = mutation({
  args: { userId: v.id("users"), name: v.string() },
  handler: async (ctx, { userId, name }) => {
    return await ctx.db.insert("people", {
      userId,
      name,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: { id: v.id("people"), name: v.string() },
  handler: async (ctx, { id, name }) => {
    await ctx.db.patch(id, { name });
  },
});

export const remove = mutation({
  args: { id: v.id("people") },
  handler: async (ctx, { id }) => {
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
