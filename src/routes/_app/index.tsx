import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/lib/auth";
import { formatCurrency, getCurrentBillingPeriod, getOrdinalSuffix, type BillFrequency } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import {
  ChevronLeft,
  ChevronRight,
  HandCoins,
  Plus,
  Trash2,
  Utensils,
  CarFront,
  ShoppingBag,
  Receipt,
  Clapperboard,
  Heart,
  MoreHorizontal,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Id } from "../../../convex/_generated/dataModel";

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
  Lending: "bg-amber-500/10 text-amber-600 border-amber-200",
  Recurring: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Food: Utensils,
  Transport: CarFront,
  Shopping: ShoppingBag,
  Bills: Receipt,
  Entertainment: Clapperboard,
  Health: Heart,
  Other: MoreHorizontal,
  Lending: HandCoins,
  Recurring: RefreshCw,
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
  const { deviceId, currency } = useAuth();
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
  const [payingBillId, setPayingBillId] = useState<Id<"bills"> | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);

  const weekDates = getWeekDates(currentWeekStart);
  const startDate = formatDate(weekDates[0]);
  const endDate = formatDate(weekDates[6]);
  const currentDate = new Date().toISOString().split("T")[0];

  const { data: expenses } = useQuery({
    ...convexQuery(api.expenses.listByDateRange, deviceId ? { deviceId, startDate, endDate } : "skip"),
    enabled: !!deviceId,
  });
  const { data: recurringExpenses } = useQuery({
    ...convexQuery(api.expenses.listByType, deviceId ? { deviceId, type: "recurring" as const } : "skip"),
    enabled: !!deviceId,
  });
  const { data: lendings } = useQuery({
    ...convexQuery(api.lending.listByDateRange, deviceId ? { deviceId, startDate, endDate } : "skip"),
    enabled: !!deviceId,
  });
  const { data: people } = useQuery({
    ...convexQuery(api.people.list, deviceId ? { deviceId } : "skip"),
    enabled: !!deviceId,
  });
  const { data: unpaidBills } = useQuery({
    ...convexQuery(api.bills.getUnpaidWithUpcomingDeadlines, deviceId ? { deviceId, currentDate } : "skip"),
    enabled: !!deviceId,
  });
  const addExpense = useMutation(api.expenses.add);
  const removeExpense = useMutation(api.expenses.remove);
  const removeLending = useMutation(api.lending.remove);
  const addBillPayment = useMutation(api.bills.addPayment);

  const peopleMap = new Map(people?.map((p) => [p._id, p.name]) ?? []);

  type SpendingItem =
    | { type: "expense"; id: Id<"expenses">; name: string; amount: number; category: string }
    | { type: "lending"; id: Id<"lending">; name: string; amount: number; personName: string }
    | { type: "recurring"; id: Id<"expenses">; name: string; amount: number; category: string; dayOfMonth: number };

  const getSpendingForDate = (date: Date): SpendingItem[] => {
    const dateStr = formatDate(date);
    const dayOfMonth = date.getDate();

    // One-time expenses for this date
    const dayExpenses: SpendingItem[] =
      expenses
        ?.filter((e) => e.type === "one-time" && e.date === dateStr)
        .map((e) => ({
          type: "expense" as const,
          id: e._id,
          name: e.name,
          amount: e.amount,
          category: e.category,
        })) ?? [];

    // Recurring expenses - show on their dayOfMonth (for months after creation) OR on the day they were created
    const dayRecurring: SpendingItem[] =
      recurringExpenses
        ?.filter((e) => {
          const createdDate = new Date(e.createdAt);
          const createdDateStr = formatDate(createdDate);

          // Show on the day it was created (first occurrence)
          if (createdDateStr === dateStr) return true;

          // Show on the dayOfMonth for months after creation
          if (e.dayOfMonth === dayOfMonth) {
            // Only show if we're in a month after creation, or same month but creation was before this day
            const createdYear = createdDate.getFullYear();
            const createdMonth = createdDate.getMonth();
            const currentYear = date.getFullYear();
            const currentMonth = date.getMonth();

            // If current month is after creation month, show it
            if (currentYear > createdYear || (currentYear === createdYear && currentMonth > createdMonth)) {
              return true;
            }
            // If same month but creation day was before or on the dayOfMonth, and we're past creation
            if (currentYear === createdYear && currentMonth === createdMonth) {
              return createdDate.getDate() <= e.dayOfMonth && date >= createdDate;
            }
          }
          return false;
        })
        .map((e) => ({
          type: "recurring" as const,
          id: e._id,
          name: e.name,
          amount: e.amount,
          category: e.category,
          dayOfMonth: e.dayOfMonth ?? 1,
        })) ?? [];

    // Lending transactions
    const dayLendings: SpendingItem[] =
      lendings
        ?.filter((l) => l.date === dateStr && l.amount > 0) // Only show money lent out (positive amounts)
        .map((l) => ({
          type: "lending" as const,
          id: l._id,
          name: l.note || "Lent money",
          amount: l.amount,
          personName: peopleMap.get(l.personId) ?? "Unknown",
        })) ?? [];

    return [...dayExpenses, ...dayRecurring, ...dayLendings];
  };

  const selectedDateStr = formatDate(selectedDate);
  const todaySpending = getSpendingForDate(selectedDate);

  const getDayTotal = (date: Date) => {
    const items = getSpendingForDate(date);
    return items.reduce((sum, item) => sum + item.amount, 0);
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
    if (!deviceId || !newExpense.name || !newExpense.amount) return;

    addExpense({
      deviceId,
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

  const handlePayBill = (bill: NonNullable<typeof unpaidBills>[0]) => {
    if (!deviceId || !paymentAmount) return;

    const period = getCurrentBillingPeriod(bill.bill.frequency as BillFrequency);

    addBillPayment({
      deviceId,
      billId: bill.bill._id,
      amount: parseFloat(paymentAmount),
      periodStart: period.start,
      periodEnd: period.end,
      paidAt: paymentDate,
    });

    setPayingBillId(null);
    setPaymentAmount("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
  };

  const openPayDialog = (bill: NonNullable<typeof unpaidBills>[0]) => {
    setPayingBillId(bill.bill._id);
    setPaymentAmount(bill.bill.expectedAmount?.toString() ?? "");
    setPaymentDate(new Date().toISOString().split("T")[0]);
  };

  return (
    <div className="flex flex-col h-full">
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
            Week total: <span className="font-medium text-foreground">{formatCurrency(weekTotal, currency)}</span>
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
                    {formatCurrency(dayTotal, currency, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

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
            {formatCurrency(todaySpending.reduce((s, item) => s + item.amount, 0), currency)}
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

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {/* Bill Warning Cards */}
          {unpaidBills && unpaidBills.length > 0 && (
            <div className="space-y-2 mb-3">
              {unpaidBills.map((item) => {
                const isOverdue = item.daysUntilDeadline < 0;
                const period = getCurrentBillingPeriod(item.bill.frequency as BillFrequency);

                return (
                  <Card
                    key={item.bill._id}
                    className={`p-3 border-l-4 ${
                      isOverdue
                        ? "border-l-red-500 bg-red-500/5"
                        : "border-l-amber-500 bg-amber-500/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isOverdue
                              ? "bg-red-500/10 text-red-600"
                              : "bg-amber-500/10 text-amber-600"
                          }`}
                        >
                          <AlertTriangle className="size-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{item.bill.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {isOverdue ? (
                              <span className="text-red-600">
                                Overdue by {Math.abs(item.daysUntilDeadline)} day{Math.abs(item.daysUntilDeadline) !== 1 ? "s" : ""}
                              </span>
                            ) : item.daysUntilDeadline === 0 ? (
                              <span className="text-amber-600">Due today</span>
                            ) : (
                              <span>
                                Due in {item.daysUntilDeadline} day{item.daysUntilDeadline !== 1 ? "s" : ""} ({getOrdinalSuffix(item.bill.deadlineDay!)})
                              </span>
                            )}
                          </div>
                          {item.bill.expectedAmount && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Expected: {formatCurrency(item.bill.expectedAmount, currency)}
                            </div>
                          )}
                        </div>
                      </div>
                      <Dialog
                        open={payingBillId === item.bill._id}
                        onOpenChange={(open) => {
                          if (open) openPayDialog(item);
                          else setPayingBillId(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="h-7 text-xs shrink-0">
                            Pay Now
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[320px]">
                          <DialogHeader>
                            <DialogTitle className="text-base">Pay {item.bill.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <div className="text-sm text-muted-foreground">
                              Period: <span className="text-foreground font-medium">{period.label}</span>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Amount</Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Payment Date</Label>
                              <Input
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <Button
                              onClick={() => handlePayBill(item)}
                              className="w-full h-8 text-sm"
                              disabled={!paymentAmount}
                            >
                              Mark as Paid
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {todaySpending.length === 0 && (!unpaidBills || unpaidBills.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No spending for this day
            </div>
          ) : todaySpending.length === 0 ? null : (
            todaySpending.map((item) => {
              const isLending = item.type === "lending";
              const isRecurring = item.type === "recurring";
              const category = isLending ? "Lending" : item.category;
              const Icon = CATEGORY_ICONS[isLending ? "Lending" : item.category] || MoreHorizontal;
              const colorClass =
                CATEGORY_COLORS[isLending ? "Lending" : item.category] || CATEGORY_COLORS.Other;

              return (
                <Card
                  key={`${item.type}-${item.id}`}
                  className="p-3 flex flex-row items-center gap-3 transition-colors hover:bg-muted/50"
                >
                  {/* Icon Box */}
                  <div
                    className={`size-10 rounded-lg flex items-center justify-center border shrink-0 ${colorClass}`}
                  >
                    <Icon className="size-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                    <span className="text-sm font-medium truncate leading-none">{item.name}</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">
                      <span>{isLending ? `Lent to ${item.personName}` : category}</span>
                      {isRecurring && (
                        <>
                          <span className="size-0.5 rounded-full bg-muted-foreground/50" />
                          <span className="flex items-center gap-0.5">
                            <RefreshCw className="size-2.5" />
                            Monthly
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Amount & Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatCurrency(item.amount, currency)}
                    </span>
                    {!isRecurring ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="size-7 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 -mr-1"
                        onClick={() =>
                          item.type === "expense"
                            ? removeExpense({ deviceId: deviceId!, id: item.id })
                            : removeLending({ deviceId: deviceId!, id: item.id })
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : (
                      <div className="size-7" /> /* Spacer for alignment */
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
