import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/lib/auth";
import { formatCurrency, getCurrentBillingPeriod, isBillPaidForPeriod, type BillFrequency } from "@/lib/utils";
import { getToday } from "@/lib/date";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Receipt } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Id } from "../../../convex/_generated/dataModel";

import { SubscriptionCard, AddSubscriptionDialog } from "@/components/subscriptions";
import { BillCard, AddBillDialog } from "@/components/bills";
import type { NewRecurring } from "@/types/expenses";
import type { NewBill } from "@/types/bills";

export const Route = createFileRoute("/_app/recurring")({
  component: RecurringView,
});

function RecurringView() {
  const { deviceId, currency } = useAuth();
  const [activeTab, setActiveTab] = useState("subscriptions");

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <div className="px-3 pt-3 shrink-0">
          <TabsList className="w-full">
            <TabsTrigger value="subscriptions" className="flex-1 text-xs">
              <RefreshCw className="size-3 mr-1.5" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="bills" className="flex-1 text-xs">
              <Receipt className="size-3 mr-1.5" />
              Bills
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="subscriptions" className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden">
          <SubscriptionsTab deviceId={deviceId} currency={currency} />
        </TabsContent>

        <TabsContent value="bills" className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden">
          <BillsTab deviceId={deviceId} currency={currency} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============ SUBSCRIPTIONS TAB ============

function SubscriptionsTab({ deviceId, currency }: { deviceId: string | null; currency: string }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newRecurring, setNewRecurring] = useState<NewRecurring>({
    name: "",
    amount: "",
    category: "Other",
    dayOfMonth: "1",
  });

  const { data: recurringExpenses } = useQuery({
    ...convexQuery(api.expenses.listByType, deviceId ? { deviceId, type: "recurring" as const } : "skip"),
    enabled: !!deviceId,
  });
  const addExpense = useMutation(api.expenses.add);
  const removeExpense = useMutation(api.expenses.remove);

  const totalMonthly = recurringExpenses?.reduce((s, e) => s + e.amount, 0) ?? 0;

  const handleAddRecurring = () => {
    if (!deviceId || !newRecurring.name || !newRecurring.amount) return;

    addExpense({
      deviceId,
      name: newRecurring.name,
      amount: parseFloat(newRecurring.amount),
      category: newRecurring.category,
      type: "recurring",
      date: "",
      dayOfMonth: parseInt(newRecurring.dayOfMonth),
    });

    setNewRecurring({ name: "", amount: "", category: "Other", dayOfMonth: "1" });
    setIsAddOpen(false);
  };

  const sortedExpenses = [...(recurringExpenses ?? [])].sort((a, b) => (a.dayOfMonth ?? 0) - (b.dayOfMonth ?? 0));

  return (
    <>
      <div className="p-3 border-b shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium">Monthly Subscriptions</span>
            <span className="text-xs text-muted-foreground ml-2">{formatCurrency(totalMonthly, currency)}/mo</span>
          </div>
          <AddSubscriptionDialog
            open={isAddOpen}
            onOpenChange={setIsAddOpen}
            subscription={newRecurring}
            onSubscriptionChange={setNewRecurring}
            onSubmit={handleAddRecurring}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {sortedExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <RefreshCw className="size-8 mx-auto mb-2 opacity-50" />
              No subscriptions yet
            </div>
          ) : (
            sortedExpenses.map((expense) => (
              <SubscriptionCard
                key={expense._id}
                subscription={expense}
                currency={currency}
                onRemove={() => removeExpense({ deviceId: deviceId!, id: expense._id })}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </>
  );
}

// ============ BILLS TAB ============

function BillsTab({ deviceId, currency }: { deviceId: string | null; currency: string }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [payingBillId, setPayingBillId] = useState<Id<"bills"> | null>(null);
  const [expandedBillId, setExpandedBillId] = useState<Id<"bills"> | null>(null);
  const [newBill, setNewBill] = useState<NewBill>({
    name: "",
    category: "Utilities",
    frequency: "monthly",
    expectedAmount: "",
    deadlineDay: "",
    reminderDaysBefore: "3",
  });
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(getToday);

  const currentDate = getToday();

  const { data: billsWithStatus } = useQuery({
    ...convexQuery(api.bills.listWithStatus, deviceId ? { deviceId, currentDate } : "skip"),
    enabled: !!deviceId,
  });

  const addBill = useMutation(api.bills.add);
  const removeBill = useMutation(api.bills.remove);
  const addPayment = useMutation(api.bills.addPayment);
  const removePayment = useMutation(api.bills.removePayment);

  const handleAddBill = () => {
    if (!deviceId || !newBill.name) return;

    addBill({
      deviceId,
      name: newBill.name,
      category: newBill.category,
      frequency: newBill.frequency,
      expectedAmount: newBill.expectedAmount ? parseFloat(newBill.expectedAmount) : undefined,
      deadlineDay: newBill.deadlineDay ? parseInt(newBill.deadlineDay) : undefined,
      reminderDaysBefore: parseInt(newBill.reminderDaysBefore) || 3,
    });

    setNewBill({
      name: "",
      category: "Utilities",
      frequency: "monthly",
      expectedAmount: "",
      deadlineDay: "",
      reminderDaysBefore: "3",
    });
    setIsAddOpen(false);
  };

  const handlePayBill = (bill: NonNullable<typeof billsWithStatus>[0]) => {
    if (!deviceId || !paymentAmount) return;

    const period = getCurrentBillingPeriod(bill.frequency as BillFrequency);

    addPayment({
      deviceId,
      billId: bill._id,
      amount: parseFloat(paymentAmount),
      periodStart: period.start,
      periodEnd: period.end,
      paidAt: paymentDate,
    });

    setPayingBillId(null);
    setPaymentAmount("");
    setPaymentDate(getToday());
  };

  const openPayDialog = (bill: NonNullable<typeof billsWithStatus>[0]) => {
    setPayingBillId(bill._id);
    setPaymentAmount(bill.expectedAmount?.toString() ?? "");
    setPaymentDate(getToday());
  };

  return (
    <>
      <div className="p-3 border-b shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium">Bills</span>
            <span className="text-xs text-muted-foreground ml-2">{billsWithStatus?.length ?? 0} active</span>
          </div>
          <AddBillDialog
            open={isAddOpen}
            onOpenChange={setIsAddOpen}
            bill={newBill}
            onBillChange={setNewBill}
            onSubmit={handleAddBill}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {!billsWithStatus || billsWithStatus.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Receipt className="size-8 mx-auto mb-2 opacity-50" />
              No bills yet
            </div>
          ) : (
            billsWithStatus.map((bill) => {
              const period = getCurrentBillingPeriod(bill.frequency as BillFrequency);
              const isPaid = isBillPaidForPeriod(bill.payments, period.start, period.end);

              return (
                <BillCard
                  key={bill._id}
                  bill={bill}
                  currency={currency}
                  isPaid={isPaid}
                  isExpanded={expandedBillId === bill._id}
                  periodLabel={period.label}
                  isPayDialogOpen={payingBillId === bill._id}
                  paymentAmount={paymentAmount}
                  paymentDate={paymentDate}
                  onToggleExpand={() => setExpandedBillId(expandedBillId === bill._id ? null : bill._id)}
                  onOpenPayDialog={() => openPayDialog(bill)}
                  onClosePayDialog={() => setPayingBillId(null)}
                  onPaymentAmountChange={setPaymentAmount}
                  onPaymentDateChange={setPaymentDate}
                  onPay={() => handlePayBill(bill)}
                  onRemove={() => removeBill({ deviceId: deviceId!, id: bill._id })}
                  onRemovePayment={(paymentId) => removePayment({ deviceId: deviceId!, id: paymentId as Id<"billPayments"> })}
                />
              );
            })
          )}
        </div>
      </ScrollArea>
    </>
  );
}
