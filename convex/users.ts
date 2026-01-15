import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getOrCreate = mutation({
  args: { cid: v.string() },
  handler: async (ctx, { cid }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_cid", (q) => q.eq("cid", cid))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("users", {
      cid,
      createdAt: Date.now(),
    });
  },
});

export const getByCid = query({
  args: { cid: v.string() },
  handler: async (ctx, { cid }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_cid", (q) => q.eq("cid", cid))
      .first();
  },
});

export const generateSyncCode = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await ctx.db.patch(userId, { syncCode: code });
    return code;
  },
});

export const syncWithCode = mutation({
  args: { syncCode: v.string(), newCid: v.string() },
  handler: async (ctx, { syncCode, newCid }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_syncCode", (q) => q.eq("syncCode", syncCode))
      .first();

    if (!user) {
      return { success: false, error: "Invalid sync code" };
    }

    // Check if newCid already has a user
    const existingNewUser = await ctx.db
      .query("users")
      .withIndex("by_cid", (q) => q.eq("cid", newCid))
      .first();

    if (existingNewUser && existingNewUser._id !== user._id) {
      // Delete the new user since we're syncing to existing account
      await ctx.db.delete(existingNewUser._id);
    }

    // Add the new cid to the existing user (update cid to include both)
    // For simplicity, we'll create a new user entry with same data pointing to same account
    // Actually, let's just update localStorage on client side to use the synced user's cid
    return { success: true, cid: user.cid };
  },
});
