import type { Id } from "../../convex/_generated/dataModel";

export interface NewPerson {
  name: string;
}

export interface NewLending {
  personId: string;
  amount: string;
  note: string;
  isRepayment: boolean;
}

export interface Person {
  _id: Id<"people">;
  name: string;
}

export interface PersonWithBalance extends Person {
  balance: number;
}

export interface LendingTransaction {
  _id: Id<"lending">;
  personId: Id<"people">;
  amount: number;
  note?: string;
  date: string;
}
