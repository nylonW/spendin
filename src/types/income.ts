import type { Id } from "../../convex/_generated/dataModel";

export type IncomeType = "one-time" | "recurring";

export interface AdditionalIncome {
  _id: Id<"additionalIncome">;
  name: string;
  amount: number;
  source: string;
  type: IncomeType;
  date: string;
  dayOfMonth?: number;
}

export interface NewAdditionalIncome {
  name: string;
  amount: string;
  source: string;
  type: IncomeType;
  dayOfMonth: string;
}
