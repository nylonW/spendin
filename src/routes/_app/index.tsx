import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/lib/auth";
import { formatCurrency, getCurrentBillingPeriod, type BillFrequency } from "@/lib/utils";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Id } from "../../../convex/_generated/dataModel";

import { SpendingCard, WeekCalendar, AddExpenseDialog, BillWarningCard } from "@/components/expenses";
import { getWeekStart, getWeekDates, formatDateString, getToday } from "@/lib/date";
import type { SpendingItem, NewExpense } from "@/types/expenses";

export const Route = createFileRoute("/_app/")({
  component: WeekView,
});

function WeekView() {
  const { deviceId, currency } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<NewExpense>({
    name: "",
    amount: "",
    category: "Other",
    type: "one-time",
  });
  const [payingBillId, setPayingBillId] = useState<Id<"bills"> | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(getToday);

  const weekDates = getWeekDates(currentWeekStart);
  const startDate = formatDateString(weekDates[0]);
  const endDate = formatDateString(weekDates[6]);
  const currentDate = getToday();

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

  const getSpendingForDate = (date: Date): SpendingItem[] => {
    const dateStr = formatDateString(date);
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
          const createdDateStr = formatDateString(createdDate);

          // Show on the day it was created (first occurrence)
          if (createdDateStr === dateStr) return true;

          // Show on the dayOfMonth for months after creation
          if (e.dayOfMonth === dayOfMonth) {
            const createdYear = createdDate.getFullYear();
            const createdMonth = createdDate.getMonth();
            const currentYear = date.getFullYear();
            const currentMonth = date.getMonth();

            if (currentYear > createdYear || (currentYear === createdYear && currentMonth > createdMonth)) {
              return true;
            }
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
        ?.filter((l) => l.date === dateStr && l.amount > 0)
        .map((l) => ({
          type: "lending" as const,
          id: l._id,
          name: l.note || "Lent money",
          amount: l.amount,
          personName: peopleMap.get(l.personId) ?? "Unknown",
        })) ?? [];

    return [...dayExpenses, ...dayRecurring, ...dayLendings];
  };

  const selectedDateStr = formatDateString(selectedDate);
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
    setCurrentWeekStart(getWeekStart(new Date()));
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
    setPaymentDate(getToday());
  };

  const openPayDialog = (bill: NonNullable<typeof unpaidBills>[0]) => {
    setPayingBillId(bill.bill._id);
    setPaymentAmount(bill.bill.expectedAmount?.toString() ?? "");
    setPaymentDate(getToday());
  };

  return (
    <div className="flex flex-col h-full">
      <WeekCalendar
        weekDates={weekDates}
        selectedDate={selectedDate}
        weekTotal={weekTotal}
        currency={currency}
        getDayTotal={getDayTotal}
        onSelectDate={setSelectedDate}
        onPrevWeek={goToPrevWeek}
        onNextWeek={goToNextWeek}
        onToday={goToToday}
      />

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
        <AddExpenseDialog
          open={isAddOpen}
          onOpenChange={setIsAddOpen}
          expense={newExpense}
          onExpenseChange={setNewExpense}
          onSubmit={handleAddExpense}
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {/* Bill Warning Cards */}
          {unpaidBills && unpaidBills.length > 0 && (
            <div className="space-y-2 mb-3">
              {unpaidBills.map((item) => {
                const period = getCurrentBillingPeriod(item.bill.frequency as BillFrequency);

                return (
                  <BillWarningCard
                    key={item.bill._id}
                    item={item}
                    currency={currency}
                    periodLabel={period.label}
                    isPayDialogOpen={payingBillId === item.bill._id}
                    paymentAmount={paymentAmount}
                    paymentDate={paymentDate}
                    onOpenPayDialog={() => openPayDialog(item)}
                    onClosePayDialog={() => setPayingBillId(null)}
                    onPaymentAmountChange={setPaymentAmount}
                    onPaymentDateChange={setPaymentDate}
                    onPay={() => handlePayBill(item)}
                  />
                );
              })}
            </div>
          )}

          {todaySpending.length === 0 && (!unpaidBills || unpaidBills.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No spending for this day</div>
          ) : todaySpending.length === 0 ? null : (
            todaySpending.map((item) => (
              <SpendingCard
                key={`${item.type}-${item.id}`}
                item={item}
                currency={currency}
                onRemove={() => {
                  if (item.type === "expense") {
                    removeExpense({ deviceId: deviceId!, id: item.id });
                  } else if (item.type === "lending") {
                    removeLending({ deviceId: deviceId!, id: item.id });
                  }
                }}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
