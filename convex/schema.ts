import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    syncCode: v.optional(v.string()), // optional sync code for multi-device
    currency: v.optional(v.string()), // USD, EUR, PLN
    createdAt: v.number(),
  }).index("by_syncCode", ["syncCode"]),

  devices: defineTable({
    deviceId: v.string(), // client id - generated uuid stored in localStorage
    userId: v.id("users"),
    name: v.optional(v.string()), // optional device name
    createdAt: v.number(),
  })
    .index("by_deviceId", ["deviceId"])
    .index("by_user", ["userId"]),

  expenses: defineTable({
    userId: v.id("users"),
    name: v.string(),
    amount: v.number(),
    category: v.string(),
    type: v.union(v.literal("one-time"), v.literal("recurring")),
    date: v.string(), // ISO date string for one-time, or day of month for recurring
    dayOfMonth: v.optional(v.number()), // 1-31 for recurring expenses
    billId: v.optional(v.id("bills")), // Link to bill definition (for bill payments)
    periodStart: v.optional(v.string()), // For bill payments: start of billing period
    periodEnd: v.optional(v.string()), // For bill payments: end of billing period
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "type"])
    .index("by_user_date", ["userId", "date"])
    .index("by_bill", ["billId"]),

  people: defineTable({
    userId: v.id("users"),
    name: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  lending: defineTable({
    userId: v.id("users"),
    personId: v.id("people"),
    amount: v.number(), // positive = lent to them, negative = they paid back
    note: v.optional(v.string()),
    date: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_person", ["personId"]),

  income: defineTable({
    userId: v.id("users"),
    salary: v.number(),
    savings: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  additionalIncome: defineTable({
    userId: v.id("users"),
    name: v.string(),
    amount: v.number(),
    source: v.string(), // "Freelance", "Gift", "Rental", etc.
    type: v.union(v.literal("one-time"), v.literal("recurring")),
    date: v.string(), // ISO date string for one-time, or day of month for recurring
    dayOfMonth: v.optional(v.number()), // 1-31 for recurring income
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "type"])
    .index("by_user_date", ["userId", "date"]),

  bills: defineTable({
    userId: v.id("users"),
    name: v.string(), // "Electricity", "Internet", "Rent - Landlord"
    category: v.string(), // "Utilities", "Housing", etc.
    frequency: v.string(), // "monthly", "bimonthly", "quarterly", "yearly"
    expectedAmount: v.optional(v.number()), // Optional - for variable bills like utilities
    deadlineDay: v.optional(v.number()), // Day of period (1-31) - null means no deadline
    reminderDaysBefore: v.optional(v.number()), // Days before deadline to show warning (default: 3)
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"]),

  billPayments: defineTable({
    userId: v.id("users"),
    billId: v.id("bills"),
    amount: v.number(), // Actual amount paid
    periodStart: v.string(), // ISO date - start of billing period
    periodEnd: v.string(), // ISO date - end of billing period
    paidAt: v.string(), // ISO date when payment was made
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_bill", ["billId"])
    .index("by_user_period", ["userId", "periodStart"]),
});
