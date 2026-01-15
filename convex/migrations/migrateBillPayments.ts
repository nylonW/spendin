import { internalMutation } from "../_generated/server";

/**
 * Migration: Convert billPayments to expenses
 *
 * This migration:
 * 1. Queries all existing billPayments
 * 2. For each payment, creates an expense with billId set
 * 3. Deletes the billPayment records
 *
 * Run this once via the Convex dashboard, then remove billPayments from schema.
 */
export const migrateBillPaymentsToExpenses = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all bill payments
    const billPayments = await ctx.db.query("billPayments").collect();

    if (billPayments.length === 0) {
      return { migrated: 0, message: "No bill payments to migrate" };
    }

    // Get all bills for name/category lookup
    const bills = await ctx.db.query("bills").collect();
    const billMap = new Map(bills.map((b) => [b._id, b]));

    let migrated = 0;

    for (const payment of billPayments) {
      const bill = billMap.get(payment.billId);

      if (!bill) {
        console.warn(`Bill not found for payment ${payment._id}, skipping`);
        continue;
      }

      // Create expense from bill payment
      await ctx.db.insert("expenses", {
        userId: payment.userId,
        name: bill.name,
        amount: payment.amount,
        category: bill.category,
        type: "one-time",
        date: payment.paidAt,
        billId: payment.billId,
        periodStart: payment.periodStart,
        periodEnd: payment.periodEnd,
        createdAt: payment.createdAt,
      });

      // Delete the old bill payment
      await ctx.db.delete(payment._id);

      migrated++;
    }

    return {
      migrated,
      message: `Successfully migrated ${migrated} bill payments to expenses`,
    };
  },
});
