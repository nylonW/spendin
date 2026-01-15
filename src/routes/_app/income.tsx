import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { getToday, getMonthRange, formatMonthYear } from "@/lib/date";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PiggyBank, Wallet, TrendingUp, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { startDate, endDate } = getMonthRange(currentMonth);

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

  // Use consolidated financial summary for accurate totals
  const { data: summary } = useQuery({
    ...convexQuery(api.summary.getMonthlyFinancialSummary, deviceId ? { deviceId, startDate, endDate } : "skip"),
    enabled: !!deviceId,
  });

  // Queries for additional income (for display)
  const { data: recurringIncome } = useQuery({
    ...convexQuery(api.additionalIncome.listByType, deviceId ? { deviceId, type: "recurring" as const } : "skip"),
    enabled: !!deviceId,
  });

  // One-time income filtered by current month
  const { data: additionalIncomeForMonth } = useQuery({
    ...convexQuery(api.additionalIncome.listByDateRange, deviceId ? { deviceId, startDate, endDate } : "skip"),
    enabled: !!deviceId,
  });

  const oneTimeIncome = additionalIncomeForMonth?.filter((i) => i.type === "one-time") ?? [];
  const oneTimeIncomeTotal = oneTimeIncome.reduce((s, i) => s + i.amount, 0);

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

  // Month navigation
  const goToPrevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  // Extract from consolidated summary
  const incomeData = summary?.income;
  const spendingData = summary?.spending;

  // Income totals
  const monthlyRecurringIncome = recurringIncome?.reduce((s, e) => s + e.amount, 0) ?? 0;
  const salaryNum = parseFloat(salary) || 0;
  const savingsNum = parseFloat(savings) || 0;
  const lendingRepaidTotal = incomeData?.totals.lendingRepaid ?? 0;
  const totalMonthlyIncome = salaryNum + monthlyRecurringIncome + oneTimeIncomeTotal + lendingRepaidTotal;

  // Spending totals from summary (complete picture)
  const totalSpending = spendingData?.totals.total ?? 0;
  const recurringExpensesTotal = spendingData?.totals.recurring ?? 0;
  const oneTimeExpensesTotal = spendingData?.totals.oneTime ?? 0;
  const billsTotal = spendingData?.totals.bills ?? 0;
  const lendingOutTotal = spendingData?.totals.lending ?? 0;

  // Calculate spendable budget
  const afterSavings = totalMonthlyIncome - totalSpending - savingsNum;

  return (
    <div className="p-3 space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={goToPrevMonth}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={goToCurrentMonth} className="text-xs min-w-[140px]">
          {formatMonthYear(currentMonth)}
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={goToNextMonth}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

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

      {/* One-time Additional Income (for selected month) */}
      <Card className="p-4 block">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-emerald-600" />
            <h3 className="text-sm font-medium">One-time Income</h3>
            <span className="text-xs text-muted-foreground">
              ({currentMonth.toLocaleDateString("en", { month: "short" })})
            </span>
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
        {oneTimeIncome.length > 0 ? (
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
            No one-time income this month. Add bonuses, gifts, refunds, etc.
          </p>
        )}
        {oneTimeIncome.length > 0 && (
          <div className="flex justify-between items-center pt-2 border-t mt-2">
            <span className="text-xs text-muted-foreground">This month</span>
            <span className="text-sm font-semibold text-green-600">
              +{formatCurrency(oneTimeIncomeTotal, currency)}
            </span>
          </div>
        )}
      </Card>

      {/* Summary */}
      <Card className="p-4 block space-y-3">
        <h3 className="text-sm font-medium">
          {currentMonth.toLocaleDateString("en", { month: "long" })} Breakdown
        </h3>

        <div className="space-y-2 text-sm">
          {/* Income Section */}
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

          {oneTimeIncomeTotal > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>One-time Income</span>
              <span>+{formatCurrency(oneTimeIncomeTotal, currency)}</span>
            </div>
          )}

          {lendingRepaidTotal > 0 && (
            <div className="flex justify-between text-blue-600">
              <span>Money Returned</span>
              <span>+{formatCurrency(lendingRepaidTotal, currency)}</span>
            </div>
          )}

          <div className="h-px bg-border" />

          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Income</span>
            <span className="font-medium">{formatCurrency(totalMonthlyIncome, currency)}</span>
          </div>

          {/* Spending Section */}
          {recurringExpensesTotal > 0 && (
            <div className="flex justify-between text-destructive">
              <span>Subscriptions</span>
              <span>-{formatCurrency(recurringExpensesTotal, currency)}</span>
            </div>
          )}

          {oneTimeExpensesTotal > 0 && (
            <div className="flex justify-between text-destructive">
              <span>One-time Expenses</span>
              <span>-{formatCurrency(oneTimeExpensesTotal, currency)}</span>
            </div>
          )}

          {billsTotal > 0 && (
            <div className="flex justify-between text-destructive">
              <span>Bills</span>
              <span>-{formatCurrency(billsTotal, currency)}</span>
            </div>
          )}

          {lendingOutTotal > 0 && (
            <div className="flex justify-between text-amber-600">
              <span>Money Lent</span>
              <span>-{formatCurrency(lendingOutTotal, currency)}</span>
            </div>
          )}

          <div className="h-px bg-border" />

          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Spending</span>
            <span className="font-medium text-destructive">-{formatCurrency(totalSpending, currency)}</span>
          </div>

          <div className="flex justify-between text-green-600">
            <span>Monthly Savings</span>
            <span>-{formatCurrency(savingsNum, currency)}</span>
          </div>

          <div className="h-px bg-border" />

          <div className="flex justify-between text-base">
            <span className="font-medium">Remaining</span>
            <span
              className={`font-semibold ${afterSavings >= 0 ? "text-primary" : "text-destructive"}`}
            >
              {formatCurrency(afterSavings, currency)}
            </span>
          </div>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Budget for {currentMonth.toLocaleDateString("en", { month: "long", year: "numeric" })} after all expenses and savings.
      </p>
    </div>
  );
}
