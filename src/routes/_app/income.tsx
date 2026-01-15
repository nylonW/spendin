import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PiggyBank, Wallet } from "lucide-react";

export const Route = createFileRoute("/_app/income")({
  component: IncomeView,
});

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

  const { data: recurringExpenses } = useQuery({
    ...convexQuery(api.expenses.listByType, deviceId ? { deviceId, type: "recurring" as const } : "skip"),
    enabled: !!deviceId,
  });

  const monthlyRecurring = recurringExpenses?.reduce((s, e) => s + e.amount, 0) ?? 0;
  const salaryNum = parseFloat(salary) || 0;
  const savingsNum = parseFloat(savings) || 0;
  const afterRecurring = salaryNum - monthlyRecurring;
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

      {/* Summary */}
      <Card className="p-4 block space-y-3">
        <h3 className="text-sm font-medium">Monthly Breakdown</h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Monthly Income</span>
            <span className="font-medium">{formatCurrency(salaryNum, currency)}</span>
          </div>

          <div className="flex justify-between text-destructive">
            <span>Recurring Expenses</span>
            <span>-{formatCurrency(monthlyRecurring, currency)}</span>
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
