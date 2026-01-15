import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

/**
 * Get a device by its deviceId (the UUID stored in localStorage)
 */
export async function getDevice(
  ctx: QueryCtx,
  { deviceId }: { deviceId: string }
): Promise<Doc<"devices"> | null> {
  return await ctx.db
    .query("devices")
    .withIndex("by_deviceId", (q) => q.eq("deviceId", deviceId))
    .first();
}

/**
 * Get a user by deviceId - returns the user associated with this device
 * Throws if device not found
 */
export async function getUserByDeviceId(
  ctx: QueryCtx,
  { deviceId }: { deviceId: string }
): Promise<Doc<"users">> {
  const device = await getDevice(ctx, { deviceId });
  if (!device) {
    throw new Error("Device not found");
  }

  const user = await ctx.db.get(device.userId);
  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

/**
 * Get user ID by deviceId - convenience function when you just need the ID
 * Throws if device not found
 */
export async function getUserIdByDeviceId(
  ctx: QueryCtx,
  { deviceId }: { deviceId: string }
): Promise<Id<"users">> {
  const device = await getDevice(ctx, { deviceId });
  if (!device) {
    throw new Error("Device not found");
  }
  return device.userId;
}

/**
 * Get or create a user for a device
 * If deviceId exists, returns existing user
 * If not, creates new user and device
 */
export async function getOrCreateUserForDevice(
  ctx: MutationCtx,
  { deviceId }: { deviceId: string }
): Promise<{ userId: Id<"users">; isNew: boolean }> {
  const existingDevice = await getDevice(ctx, { deviceId });

  if (existingDevice) {
    return { userId: existingDevice.userId, isNew: false };
  }

  // Create new user
  const userId = await ctx.db.insert("users", {
    createdAt: Date.now(),
  });

  // Create device linked to user
  await ctx.db.insert("devices", {
    deviceId,
    userId,
    createdAt: Date.now(),
  });

  return { userId, isNew: true };
}

/**
 * Get all devices for a user
 */
export async function getDevicesForUser(
  ctx: QueryCtx,
  { userId }: { userId: Id<"users"> }
): Promise<Doc<"devices">[]> {
  return await ctx.db
    .query("devices")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
}

/**
 * Transfer a device to another user (via sync code)
 */
export async function transferDeviceToUser(
  ctx: MutationCtx,
  { deviceId, newUserId }: { deviceId: string; newUserId: Id<"users"> }
): Promise<void> {
  const device = await getDevice(ctx, { deviceId });
  if (!device) {
    throw new Error("Device not found");
  }

  const oldUserId = device.userId;

  // Update device to point to new user
  await ctx.db.patch(device._id, { userId: newUserId });

  // Check if old user has any remaining devices
  const remainingDevices = await ctx.db
    .query("devices")
    .withIndex("by_user", (q) => q.eq("userId", oldUserId))
    .first();

  // If old user has no more devices, delete the user and their data
  if (!remainingDevices) {
    await deleteUserAndData(ctx, { userId: oldUserId });
  }
}

/**
 * Delete a user and all their associated data
 */
export async function deleteUserAndData(
  ctx: MutationCtx,
  { userId }: { userId: Id<"users"> }
): Promise<void> {
  // Delete all expenses
  const expenses = await ctx.db
    .query("expenses")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const expense of expenses) {
    await ctx.db.delete(expense._id);
  }

  // Delete all people and their lending records
  const people = await ctx.db
    .query("people")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const person of people) {
    const lendings = await ctx.db
      .query("lending")
      .withIndex("by_person", (q) => q.eq("personId", person._id))
      .collect();
    for (const lending of lendings) {
      await ctx.db.delete(lending._id);
    }
    await ctx.db.delete(person._id);
  }

  // Delete income
  const income = await ctx.db
    .query("income")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  if (income) {
    await ctx.db.delete(income._id);
  }

  // Delete all bill payments
  const billPayments = await ctx.db
    .query("billPayments")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const payment of billPayments) {
    await ctx.db.delete(payment._id);
  }

  // Delete all bills
  const bills = await ctx.db
    .query("bills")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const bill of bills) {
    await ctx.db.delete(bill._id);
  }

  // Delete the user
  await ctx.db.delete(userId);
}
