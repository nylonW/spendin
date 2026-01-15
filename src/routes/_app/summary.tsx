import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_app/summary")({
  component: SummaryView,
});

const CATEGORY_COLORS: Record<string, string> = {
  Food: "bg-orange-500",
  Transport: "bg-blue-500",
  Shopping: "bg-pink-500",
  Bills: "bg-red-500",
  Entertainment: "bg-purple-500",
  Health: "bg-green-500",
  Other: "bg-gray-500",
  Subscriptions: "bg-indigo-500",
};

function SummaryView() {
  const { deviceId, currencySymbol } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data: allExpenses } = useQuery({
    ...convexQuery(api.expenses.list, deviceId ? { deviceId } : "skip"),
    enabled: !!deviceId,
  });
  const { data: income } = useQuery({
    ...convexQuery(api.income.get, deviceId ? { deviceId } : "skip"),
    enabled: !!deviceId,
  });

  const oneTimeExpenses =
    allExpenses?.filter((e) => e.type === "one-time" && e.date >= startDate && e.date <= endDate) ??
    [];
  const recurringExpenses = allExpenses?.filter((e) => e.type === "recurring") ?? [];

  const oneTimeTotal = oneTimeExpenses.reduce((s, e) => s + e.amount, 0);
  const recurringTotal = recurringExpenses.reduce((s, e) => s + e.amount, 0);
  const totalSpending = oneTimeTotal + recurringTotal;

  const monthlyIncome = income?.salary ?? 0;
  const savings = income?.savings ?? 0;
  const remaining = monthlyIncome - totalSpending;

  const categoryTotals: Record<string, number> = {};
  for (const exp of oneTimeExpenses) {
    categoryTotals[exp.category] = (categoryTotals[exp.category] ?? 0) + exp.amount;
  }
  for (const exp of recurringExpenses) {
    categoryTotals["Subscriptions"] = (categoryTotals["Subscriptions"] ?? 0) + exp.amount;
  }

  const sortedCategories = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a);

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

  return (
    <div className="flex flex-col h-full">
      {/* Month Navigation */}
      <div className="p-3 border-b shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={goToPrevMonth}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToCurrentMonth} className="text-xs">
              {currentMonth.toLocaleDateString("en", { month: "long", year: "numeric" })}
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={goToNextMonth}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 gap-2">
            <Card className="p-3">
              <div className="text-xs text-muted-foreground">Total Spending</div>
              <div className="text-lg font-semibold text-destructive">
                {currencySymbol}{totalSpending.toFixed(2)}
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-xs text-muted-foreground">Remaining</div>
              <div
                className={`text-lg font-semibold ${remaining >= 0 ? "text-green-600" : "text-destructive"}`}
              >
                {currencySymbol}{remaining.toFixed(2)}
              </div>
            </Card>
          </div>

          {/* Income vs Spending */}
          {monthlyIncome > 0 && (
            <Card className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Budget Used</span>
                <span className="text-xs font-medium">
                  {Math.min(100, Math.round((totalSpending / monthlyIncome) * 100))}%
                </span>
              </div>
              <Progress
                value={Math.min(100, (totalSpending / monthlyIncome) * 100)}
                className="h-2"
              />
              <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
                <span>{currencySymbol}{totalSpending.toFixed(0)} spent</span>
                <span>{currencySymbol}{monthlyIncome.toFixed(0)} income</span>
              </div>
            </Card>
          )}

          {/* Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Spending by Category</h3>
            </div>
            <div className="space-y-2">
              {sortedCategories.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No expenses this month
                </div>
              ) : (
                sortedCategories.map(([category, amount]) => {
                  const percentage = totalSpending > 0 ? (amount / totalSpending) * 100 : 0;
                  return (
                    <Card key={category} className="p-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`size-2.5 rounded-full ${CATEGORY_COLORS[category] || "bg-gray-500"}`}
                          />
                          <span className="text-sm">{category}</span>
                        </div>
                        <span className="text-sm font-medium">{currencySymbol}{amount.toFixed(2)}</span>
                      </div>
                      <Progress value={percentage} className="h-1" />
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2">
            <Card className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingDown className="size-3 text-orange-500" />
                <span className="text-xs text-muted-foreground">One-time</span>
              </div>
              <div className="text-sm font-medium">{currencySymbol}{oneTimeTotal.toFixed(2)}</div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="size-3 text-indigo-500" />
                <span className="text-xs text-muted-foreground">Recurring</span>
              </div>
              <div className="text-sm font-medium">{currencySymbol}{recurringTotal.toFixed(2)}</div>
            </Card>
          </div>

          {/* Savings */}
          {savings > 0 && (
            <Card className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Current Savings</div>
              <div className="text-lg font-semibold text-green-600">{currencySymbol}{savings.toFixed(2)}</div>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
