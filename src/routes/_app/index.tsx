import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export const Route = createFileRoute("/_app/")({
  component: WeekView,
});

const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Other",
];

const CATEGORY_COLORS: Record<string, string> = {
  Food: "bg-orange-500/10 text-orange-600 border-orange-200",
  Transport: "bg-blue-500/10 text-blue-600 border-blue-200",
  Shopping: "bg-pink-500/10 text-pink-600 border-pink-200",
  Bills: "bg-red-500/10 text-red-600 border-red-200",
  Entertainment: "bg-purple-500/10 text-purple-600 border-purple-200",
  Health: "bg-green-500/10 text-green-600 border-green-200",
  Other: "bg-gray-500/10 text-gray-600 border-gray-200",
};

function getWeekDates(date: Date): Date[] {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);

  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    week.push(d);
  }
  return week;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function isToday(date: Date): boolean {
  const today = new Date();
  return formatDate(date) === formatDate(today);
}

function WeekView() {
  const { userId } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    name: "",
    amount: "",
    category: "Other",
    type: "one-time" as const,
  });

  const weekDates = getWeekDates(currentWeekStart);
  const startDate = formatDate(weekDates[0]);
  const endDate = formatDate(weekDates[6]);

  const { data: expenses } = useQuery({
    ...convexQuery(api.expenses.listByDateRange, userId ? { userId, startDate, endDate } : "skip"),
    enabled: !!userId,
  });
  const addExpense = useMutation(api.expenses.add);
  const removeExpense = useMutation(api.expenses.remove);

  const selectedDateStr = formatDate(selectedDate);
  const todayExpenses =
    expenses?.filter((e) => e.type === "one-time" && e.date === selectedDateStr) ?? [];

  const getExpensesForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return expenses?.filter((e) => e.type === "one-time" && e.date === dateStr) ?? [];
  };

  const getDayTotal = (date: Date) => {
    const dayExpenses = getExpensesForDate(date);
    return dayExpenses.reduce((sum, e) => sum + e.amount, 0);
  };

  const goToPrevWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
    setSelectedDate(new Date());
  };

  const handleAddExpense = () => {
    if (!userId || !newExpense.name || !newExpense.amount) return;

    addExpense({
      userId,
      name: newExpense.name,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      type: newExpense.type,
      date: selectedDateStr,
    });

    setNewExpense({ name: "", amount: "", category: "Other", type: "one-time" });
    setIsAddOpen(false);
  };

  const weekTotal = weekDates.reduce((sum, d) => sum + getDayTotal(d), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Week Calendar */}
      <div className="p-3 border-b shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={goToPrevWeek}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs">
              Today
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={goToNextWeek}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            Week total: <span className="font-medium text-foreground">${weekTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDates.map((date) => {
            const dateStr = formatDate(date);
            const isSelected = dateStr === selectedDateStr;
            const isTodayDate = isToday(date);
            const dayTotal = getDayTotal(date);
            const hasExpenses = dayTotal > 0;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(date)}
                className={`
                  flex flex-col items-center p-1.5 rounded-md transition-colors text-center
                  ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"}
                  ${isTodayDate && !isSelected ? "ring-1 ring-primary" : ""}
                `}
              >
                <span className="text-[10px] uppercase opacity-70">
                  {date.toLocaleDateString("en", { weekday: "short" })}
                </span>
                <span className="text-sm font-medium">{date.getDate()}</span>
                {hasExpenses && (
                  <span
                    className={`text-[10px] ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                  >
                    ${dayTotal.toFixed(0)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Header */}
      <div className="px-3 py-2 flex items-center justify-between border-b shrink-0">
        <div>
          <span className="text-sm font-medium">
            {selectedDate.toLocaleDateString("en", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </span>
          <span className="text-xs text-muted-foreground ml-2">
            ${todayExpenses.reduce((s, e) => s + e.amount, 0).toFixed(2)}
          </span>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 text-xs">
              <Plus className="size-3" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[320px]">
            <DialogHeader>
              <DialogTitle className="text-base">Add Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input
                  placeholder="Coffee, Groceries..."
                  value={newExpense.name}
                  onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Select
                  value={newExpense.category}
                  onValueChange={(v) => setNewExpense({ ...newExpense, category: v })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-sm">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddExpense} className="w-full h-8 text-sm">
                Add Expense
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Expenses List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {todayExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No expenses for this day
            </div>
          ) : (
            todayExpenses.map((expense) => (
              <Card
                key={expense._id}
                className="p-2.5 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Badge
                    variant="outline"
                    className={`text-[10px] shrink-0 ${CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.Other}`}
                  >
                    {expense.category}
                  </Badge>
                  <span className="text-sm truncate">{expense.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-medium">${expense.amount.toFixed(2)}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-6 text-muted-foreground hover:text-destructive"
                    onClick={() => removeExpense({ id: expense._id })}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
