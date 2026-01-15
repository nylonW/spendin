import { v } from "convex/values";
import { query } from "./_generated/server";
import * as Users from "./model/users";
import * as Financials from "./helpers/financials";

/**
 * Get complete monthly financial summary.
 * Returns all spending and income data for a month, ready for display.
 */
export const getMonthlyFinancialSummary = query({
  args: {
    deviceId: v.string(),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, { deviceId, startDate, endDate }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });
    return await Financials.getMonthlyFinancialSummary(ctx, userId, startDate, endDate);
  },
});

/**
 * Get spending breakdown for a period.
 */
export const getSpendingForPeriod = query({
  args: {
    deviceId: v.string(),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, { deviceId, startDate, endDate }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });
    return await Financials.getSpendingForPeriod(ctx, userId, startDate, endDate);
  },
});

/**
 * Get income breakdown for a period.
 */
export const getIncomeForPeriod = query({
  args: {
    deviceId: v.string(),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, { deviceId, startDate, endDate }) => {
    const userId = await Users.getUserIdByDeviceId(ctx, { deviceId });
    return await Financials.getIncomeForPeriod(ctx, userId, startDate, endDate);
  },
});
