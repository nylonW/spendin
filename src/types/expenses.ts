import type { Id } from "../../convex/_generated/dataModel";

export type ExpenseType = "one-time" | "recurring";

export type SpendingItem =
  | { type: "expense"; id: Id<"expenses">; name: string; amount: number; category: string }
  | { type: "lending"; id: Id<"lending">; name: string; amount: number; personName: string }
  | { type: "recurring"; id: Id<"expenses">; name: string; amount: number; category: string; dayOfMonth: number };

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
