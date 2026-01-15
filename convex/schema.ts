import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    cid: v.string(), // client id - generated uuid stored in localStorage
    syncCode: v.optional(v.string()), // optional sync code for multi-device
    createdAt: v.number(),
  })
    .index("by_cid", ["cid"])
    .index("by_syncCode", ["syncCode"]),

  expenses: defineTable({
    userId: v.id("users"),
    name: v.string(),
    amount: v.number(),
    category: v.string(),
    type: v.union(v.literal("one-time"), v.literal("recurring")),
    date: v.string(), // ISO date string for one-time, or day of month for recurring
    dayOfMonth: v.optional(v.number()), // 1-31 for recurring expenses
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "type"])
    .index("by_user_date", ["userId", "date"]),

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
});
