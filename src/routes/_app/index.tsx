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
  const selectedDateStr = formatDateString(selectedDate);
  const currentDate = getToday();

  // Week range for calendar totals
  const weekStartStr = formatDateString(weekDates[0]);
  const weekEndStr = formatDateString(weekDates[6]);

  // Query 1: Week totals for calendar (pre-computed on server)
  const { data: weekTotals } = useQuery({
    ...convexQuery(api.expenses.getWeekTotals, deviceId ? { deviceId, startDate: weekStartStr, endDate: weekEndStr } : "skip"),
    enabled: !!deviceId,
  });

  // Query 2: Selected date spending for the list (all-in-one from Convex)
  const { data: todaySpending } = useQuery({
    ...convexQuery(api.expenses.getSpendingForDate, deviceId ? { deviceId, date: selectedDateStr } : "skip"),
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

  const getDayTotal = (date: Date): number => {
    const dateStr = formatDateString(date);
    return weekTotals?.[dateStr] ?? 0;
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
            {formatCurrency(todaySpending?.reduce((s, item) => s + item.amount, 0) ?? 0, currency)}
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

          {(!todaySpending || todaySpending.length === 0) && (!unpaidBills || unpaidBills.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No spending for this day</div>
          ) : !todaySpending || todaySpending.length === 0 ? null : (
            todaySpending.map((item) => (
              <SpendingCard
                key={`${item.type}-${item.id}`}
                item={item as SpendingItem}
                currency={currency}
                onRemove={() => {
                  if (item.type === "expense" || item.type === "recurring" || item.type === "bill") {
                    removeExpense({ deviceId: deviceId!, id: item.id as Id<"expenses"> });
                  } else if (item.type === "lending") {
                    removeLending({ deviceId: deviceId!, id: item.id as Id<"lending"> });
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
