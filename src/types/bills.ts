import type { Id } from "../../convex/_generated/dataModel";
import type { BillFrequency } from "@/lib/utils";

export interface NewBill {
  name: string;
  category: string;
  frequency: BillFrequency;
  expectedAmount: string;
  deadlineDay: string;
  reminderDaysBefore: string;
}

export interface BillPayment {
  _id: Id<"expenses">; // Bill payments are now stored as expenses
  billId: Id<"bills"> | undefined;
  amount: number;
  periodStart: string;
  periodEnd: string;
  paidAt: string;
  [key: string]: unknown; // Allow extra fields from API
}

export interface BillWithStatus {
  _id: Id<"bills">;
  name: string;
  category: string;
  frequency: string;
  expectedAmount?: number;
  deadlineDay?: number;
  reminderDaysBefore?: number;
  payments: BillPayment[];
  trend?: {
    direction: "up" | "down" | "stable";
    percentage: number;
  };
}
