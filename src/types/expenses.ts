import type { Id } from "../../convex/_generated/dataModel";

export type ExpenseType = "one-time" | "recurring";

export type SpendingItem =
  | { type: "expense"; id: Id<"expenses">; name: string; amount: number; category: string; createdAt: number }
  | { type: "lending"; id: Id<"lending">; name: string; amount: number; personName: string; createdAt: number }
  | { type: "recurring"; id: Id<"expenses">; name: string; amount: number; category: string; dayOfMonth: number; createdAt: number };

export interface NewExpense {
  name: string;
  amount: string;
  category: string;
  type: ExpenseType;
}

export interface NewRecurring {
  name: string;
  amount: string;
  category: string;
  dayOfMonth: string;
}
