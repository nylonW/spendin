import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import * as Users from "./model/users";

export const getOrCreate = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const { userId } = await Users.getOrCreateUserForDevice(ctx, { deviceId });
    return userId;
  },
});

export const getByDeviceId = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const device = await Users.getDevice(ctx, { deviceId });
    if (!device) return null;

    const user = await ctx.db.get(device.userId);
    return user;
  },
});

export const getDevices = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });
    return await Users.getDevicesForUser(ctx, { userId });
  },
});

export const generateSyncCode = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await ctx.db.patch(userId, { syncCode: code });
    return code;
  },
});

export const syncWithCode = mutation({
  args: { syncCode: v.string(), deviceId: v.string() },
  handler: async (ctx, { syncCode, deviceId }) => {
    // Find user with this sync code
    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_syncCode", (q) => q.eq("syncCode", syncCode))
      .first();

    if (!targetUser) {
      return { success: false, error: "Invalid sync code" };
    }

    // Check if device already exists
    const existingDevice = await Users.getDevice(ctx, { deviceId });

    if (existingDevice) {
      // Device exists - transfer it to the target user
      if (existingDevice.userId === targetUser._id) {
        return { success: true, message: "Already synced" };
      }
      await Users.transferDeviceToUser(ctx, {
        deviceId,
        newUserId: targetUser._id,
      });
    } else {
      // New device - just create it linked to target user
      await ctx.db.insert("devices", {
        deviceId,
        userId: targetUser._id,
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});

export const renameDevice = mutation({
  args: { deviceId: v.string(), name: v.string() },
  handler: async (ctx, { deviceId, name }) => {
    const device = await Users.getDevice(ctx, { deviceId });
    if (!device) {
      throw new Error("Device not found");
    }
    await ctx.db.patch(device._id, { name });
  },
});

export const removeDevice = mutation({
  args: { deviceId: v.string(), targetDeviceId: v.string() },
  handler: async (ctx, { deviceId, targetDeviceId }) => {
    // Verify the requesting device owns this user
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });

    const targetDevice = await Users.getDevice(ctx, { deviceId: targetDeviceId });
    if (!targetDevice || targetDevice.userId !== userId) {
      throw new Error("Device not found or not owned by this user");
    }

    // Can't remove your own device
    if (deviceId === targetDeviceId) {
      throw new Error("Cannot remove your own device");
    }

    await ctx.db.delete(targetDevice._id);
  },
});

export const updateCurrency = mutation({
  args: { deviceId: v.string(), currency: v.string() },
  handler: async (ctx, { deviceId, currency }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });
    await ctx.db.patch(userId, { currency });
  },
});
