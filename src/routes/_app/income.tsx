import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { getToday } from "@/lib/date";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PiggyBank, Wallet, TrendingUp, RefreshCw } from "lucide-react";
import { AddIncomeDialog, IncomeCard } from "@/components/income";
import type { NewAdditionalIncome, AdditionalIncome } from "@/types/income";
import { INCOME_SOURCES } from "@/constants/categories";

export const Route = createFileRoute("/_app/income")({
  component: IncomeView,
});

const defaultNewIncome: NewAdditionalIncome = {
  name: "",
  amount: "",
  source: INCOME_SOURCES[0],
  type: "one-time",
  dayOfMonth: "1",
};

function IncomeView() {
  const { deviceId, currency, currencySymbol } = useAuth();
  const { data: income } = useQuery({
    ...convexQuery(api.income.get, deviceId ? { deviceId } : "skip"),
    enabled: !!deviceId,
  });
  const upsertIncome = useMutation(api.income.upsert);

  const [salary, setSalary] = useState("");
  const [savings, setSavings] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  // Additional income state
  const [addIncomeOpen, setAddIncomeOpen] = useState(false);
  const [newIncome, setNewIncome] = useState<NewAdditionalIncome>(defaultNewIncome);

  // Queries for additional income
  const { data: recurringIncome } = useQuery({
    ...convexQuery(api.additionalIncome.listByType, deviceId ? { deviceId, type: "recurring" as const } : "skip"),
    enabled: !!deviceId,
  });

  const { data: oneTimeIncome } = useQuery({
    ...convexQuery(api.additionalIncome.listByType, deviceId ? { deviceId, type: "one-time" as const } : "skip"),
    enabled: !!deviceId,
  });

  // Mutations for additional income
  const addAdditionalIncome = useMutation(api.additionalIncome.add);
  const removeAdditionalIncome = useMutation(api.additionalIncome.remove);

  useEffect(() => {
    if (income) {
      setSalary(income.salary.toString());
      setSavings(income.savings.toString());
    }
  }, [income]);

  const handleSave = () => {
    if (!deviceId) return;

    upsertIncome({
      deviceId,
      salary: parseFloat(salary) || 0,
      savings: parseFloat(savings) || 0,
    });
    setIsDirty(false);
  };

  const handleSalaryChange = (value: string) => {
    setSalary(value);
    setIsDirty(true);
  };

  const handleSavingsChange = (value: string) => {
    setSavings(value);
    setIsDirty(true);
  };

  const handleAddIncome = () => {
    if (!deviceId || !newIncome.name || !newIncome.amount) return;

    addAdditionalIncome({
      deviceId,
      name: newIncome.name,
      amount: parseFloat(newIncome.amount),
      source: newIncome.source,
      type: newIncome.type,
      date: newIncome.type === "one-time" ? getToday() : String(newIncome.dayOfMonth),
      dayOfMonth: newIncome.type === "recurring" ? parseInt(newIncome.dayOfMonth) : undefined,
    });
    setNewIncome(defaultNewIncome);
    setAddIncomeOpen(false);
  };

  const handleDeleteIncome = (id: AdditionalIncome["_id"]) => {
    if (!deviceId) return;
    removeAdditionalIncome({ deviceId, id });
  };

  const { data: recurringExpenses } = useQuery({
    ...convexQuery(api.expenses.listByType, deviceId ? { deviceId, type: "recurring" as const } : "skip"),
    enabled: !!deviceId,
  });

  // Calculate totals
  const monthlyRecurringExpenses = recurringExpenses?.reduce((s, e) => s + e.amount, 0) ?? 0;
  const monthlyRecurringIncome = recurringIncome?.reduce((s, e) => s + e.amount, 0) ?? 0;
  const salaryNum = parseFloat(salary) || 0;
  const savingsNum = parseFloat(savings) || 0;
  const totalMonthlyIncome = salaryNum + monthlyRecurringIncome;
  const afterRecurring = totalMonthlyIncome - monthlyRecurringExpenses;
  const afterSavings = afterRecurring - savingsNum;

  return (
    <div className="p-3 space-y-4">
      {/* Monthly Salary */}
      <Card className="p-4 block">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="size-4 text-primary" />
          <h3 className="text-sm font-medium">Monthly Salary</h3>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Net income after taxes</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {currencySymbol}
            </span>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={salary}
              onChange={(e) => handleSalaryChange(e.target.value)}
              className="h-10 text-lg pl-7"
            />
          </div>
        </div>
      </Card>

      {/* Savings Goal */}
      <Card className="p-4 block">
        <div className="flex items-center gap-2 mb-3">
          <PiggyBank className="size-4 text-green-600" />
          <h3 className="text-sm font-medium">Monthly Savings</h3>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Amount you want to save each month</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {currencySymbol}
            </span>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={savings}
              onChange={(e) => handleSavingsChange(e.target.value)}
              className="h-10 text-lg pl-7"
            />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      {isDirty && (
        <Button onClick={handleSave} className="w-full">
          Save Changes
        </Button>
      )}

      {/* Recurring Additional Income */}
      <Card className="p-4 block">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="size-4 text-green-600" />
            <h3 className="text-sm font-medium">Recurring Income</h3>
          </div>
          <AddIncomeDialog
            open={addIncomeOpen && newIncome.type === "recurring"}
            onOpenChange={(open) => {
              setAddIncomeOpen(open);
              if (open) setNewIncome({ ...defaultNewIncome, type: "recurring" });
            }}
            income={{ ...newIncome, type: "recurring" }}
            onIncomeChange={setNewIncome}
            onSubmit={handleAddIncome}
          />
        </div>
        {recurringIncome && recurringIncome.length > 0 ? (
          <div className="divide-y">
            {recurringIncome.map((inc) => (
              <IncomeCard
                key={inc._id}
                income={inc as AdditionalIncome}
                currency={currency}
                onDelete={handleDeleteIncome}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">
            No recurring income added yet. Add income from rent, side jobs, etc.
          </p>
        )}
        {recurringIncome && recurringIncome.length > 0 && (
          <div className="flex justify-between items-center pt-2 border-t mt-2">
            <span className="text-xs text-muted-foreground">Monthly total</span>
            <span className="text-sm font-semibold text-green-600">
              +{formatCurrency(monthlyRecurringIncome, currency)}
            </span>
          </div>
        )}
      </Card>

      {/* One-time Additional Income */}
      <Card className="p-4 block">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-emerald-600" />
            <h3 className="text-sm font-medium">One-time Income</h3>
          </div>
          <AddIncomeDialog
            open={addIncomeOpen && newIncome.type === "one-time"}
            onOpenChange={(open) => {
              setAddIncomeOpen(open);
              if (open) setNewIncome({ ...defaultNewIncome, type: "one-time" });
            }}
            income={{ ...newIncome, type: "one-time" }}
            onIncomeChange={setNewIncome}
            onSubmit={handleAddIncome}
          />
        </div>
        {oneTimeIncome && oneTimeIncome.length > 0 ? (
          <div className="divide-y">
            {oneTimeIncome.map((inc) => (
              <IncomeCard
                key={inc._id}
                income={inc as AdditionalIncome}
                currency={currency}
                onDelete={handleDeleteIncome}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">
            No one-time income added yet. Add bonuses, gifts, refunds, etc.
          </p>
        )}
      </Card>

      {/* Summary */}
      <Card className="p-4 block space-y-3">
        <h3 className="text-sm font-medium">Monthly Breakdown</h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Base Salary</span>
            <span className="font-medium">{formatCurrency(salaryNum, currency)}</span>
          </div>

          {monthlyRecurringIncome > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Recurring Income</span>
              <span>+{formatCurrency(monthlyRecurringIncome, currency)}</span>
            </div>
          )}

          <div className="h-px bg-border" />

          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Monthly Income</span>
            <span className="font-medium">{formatCurrency(totalMonthlyIncome, currency)}</span>
          </div>

          <div className="flex justify-between text-destructive">
            <span>Recurring Expenses</span>
            <span>-{formatCurrency(monthlyRecurringExpenses, currency)}</span>
          </div>

          <div className="h-px bg-border" />

          <div className="flex justify-between">
            <span className="text-muted-foreground">After Recurring</span>
            <span className="font-medium">{formatCurrency(afterRecurring, currency)}</span>
          </div>

          <div className="flex justify-between text-green-600">
            <span>Monthly Savings</span>
            <span>-{formatCurrency(savingsNum, currency)}</span>
          </div>

          <div className="h-px bg-border" />

          <div className="flex justify-between text-base">
            <span className="font-medium">Spendable Budget</span>
            <span
              className={`font-semibold ${afterSavings >= 0 ? "text-primary" : "text-destructive"}`}
            >
              {formatCurrency(afterSavings, currency)}
            </span>
          </div>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        This is your monthly budget after recurring expenses and savings goals.
      </p>
    </div>
  );
}
