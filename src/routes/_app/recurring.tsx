import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/lib/auth";
import {
  formatCurrency,
  BILL_FREQUENCIES,
  BILL_CATEGORIES,
  getCurrentBillingPeriod,
  isBillPaidForPeriod,
  getOrdinalSuffix,
  type BillFrequency,
} from "@/lib/utils";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Plus,
  RefreshCw,
  Trash2,
  Receipt,
  Check,
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronDown,
  ChevronUp,
  History,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Id } from "../../../convex/_generated/dataModel";

export const Route = createFileRoute("/_app/recurring")({
  component: RecurringView,
});

const SUBSCRIPTION_CATEGORIES = ["Netflix", "Spotify", "Gym", "Rent", "Insurance", "Utilities", "Other"];

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
  const [newRecurring, setNewRecurring] = useState({
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

  const sortedExpenses = [...(recurringExpenses ?? [])].sort(
    (a, b) => (a.dayOfMonth ?? 0) - (b.dayOfMonth ?? 0)
  );

  return (
    <>
      <div className="p-3 border-b shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium">Monthly Subscriptions</span>
            <span className="text-xs text-muted-foreground ml-2">
              {formatCurrency(totalMonthly, currency)}/mo
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
                <DialogTitle className="text-base">Add Subscription</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Name</Label>
                  <Input
                    placeholder="Netflix, Gym..."
                    value={newRecurring.name}
                    onChange={(e) => setNewRecurring({ ...newRecurring, name: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newRecurring.amount}
                    onChange={(e) => setNewRecurring({ ...newRecurring, amount: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Category</Label>
                  <Select
                    value={newRecurring.category}
                    onValueChange={(v) => setNewRecurring({ ...newRecurring, category: v })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBSCRIPTION_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-sm">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Day of Month</Label>
                  <Select
                    value={newRecurring.dayOfMonth}
                    onValueChange={(v) => setNewRecurring({ ...newRecurring, dayOfMonth: v })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={String(day)} className="text-sm">
                          {getOrdinalSuffix(day)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddRecurring} className="w-full h-8 text-sm">
                  Add Subscription
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
              <Card key={expense._id} className="p-2.5 flex flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge
                    variant="outline"
                    className="text-[10px] shrink-0 bg-indigo-500/10 text-indigo-600 border-indigo-200"
                  >
                    <Calendar className="size-2.5 mr-1" />
                    {expense.dayOfMonth ?? 1}
                  </Badge>
                  <div className="min-w-0">
                    <div className="text-sm truncate">{expense.name}</div>
                    <div className="text-[10px] text-muted-foreground">{expense.category}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-medium">{formatCurrency(expense.amount, currency)}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-6 text-muted-foreground hover:text-destructive"
                    onClick={() => removeExpense({ deviceId: deviceId!, id: expense._id })}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </Card>
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
  const [newBill, setNewBill] = useState({
    name: "",
    category: "Utilities",
    frequency: "monthly" as BillFrequency,
    expectedAmount: "",
    deadlineDay: "",
    reminderDaysBefore: "3",
  });
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);

  const currentDate = new Date().toISOString().split("T")[0];

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
    setPaymentDate(new Date().toISOString().split("T")[0]);
  };

  const openPayDialog = (bill: NonNullable<typeof billsWithStatus>[0]) => {
    setPayingBillId(bill._id);
    setPaymentAmount(bill.expectedAmount?.toString() ?? "");
    setPaymentDate(new Date().toISOString().split("T")[0]);
  };

  return (
    <>
      <div className="p-3 border-b shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium">Bills</span>
            <span className="text-xs text-muted-foreground ml-2">
              {billsWithStatus?.length ?? 0} active
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
                <DialogTitle className="text-base">Add Bill</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Name</Label>
                  <Input
                    placeholder="Electricity, Internet..."
                    value={newBill.name}
                    onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Category</Label>
                  <Select
                    value={newBill.category}
                    onValueChange={(v) => setNewBill({ ...newBill, category: v })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BILL_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-sm">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Frequency</Label>
                  <Select
                    value={newBill.frequency}
                    onValueChange={(v) => setNewBill({ ...newBill, frequency: v as BillFrequency })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BILL_FREQUENCIES.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value} className="text-sm">
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Expected Amount (optional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Leave empty for variable"
                    value={newBill.expectedAmount}
                    onChange={(e) => setNewBill({ ...newBill, expectedAmount: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Payment Deadline Day (optional)</Label>
                  <Select
                    value={newBill.deadlineDay}
                    onValueChange={(v) => setNewBill({ ...newBill, deadlineDay: v })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="No deadline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-sm">
                        No deadline
                      </SelectItem>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={String(day)} className="text-sm">
                          {getOrdinalSuffix(day)} of the period
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Reminder Days Before</Label>
                  <Input
                    type="number"
                    min="1"
                    max="14"
                    value={newBill.reminderDaysBefore}
                    onChange={(e) => setNewBill({ ...newBill, reminderDaysBefore: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <Button onClick={handleAddBill} className="w-full h-8 text-sm">
                  Add Bill
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
              const isExpanded = expandedBillId === bill._id;
              const frequencyLabel = BILL_FREQUENCIES.find((f) => f.value === bill.frequency)?.label ?? bill.frequency;

              return (
                <Card key={bill._id} className="overflow-hidden">
                  <div className="p-2.5 flex flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {/* Status indicator */}
                      <div
                        className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isPaid
                            ? "bg-green-500/10 text-green-600"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {isPaid ? <Check className="size-4" /> : <Clock className="size-4" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium truncate">{bill.name}</span>
                          {bill.trend && (
                            <span
                              className={`flex items-center text-[10px] ${
                                bill.trend.direction === "up"
                                  ? "text-red-500"
                                  : bill.trend.direction === "down"
                                    ? "text-green-500"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {bill.trend.direction === "up" ? (
                                <TrendingUp className="size-2.5" />
                              ) : bill.trend.direction === "down" ? (
                                <TrendingDown className="size-2.5" />
                              ) : null}
                              {bill.trend.percentage > 0 && `${bill.trend.percentage}%`}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span>{bill.category}</span>
                          <span className="size-0.5 rounded-full bg-muted-foreground/50" />
                          <span>{frequencyLabel}</span>
                          {bill.deadlineDay && (
                            <>
                              <span className="size-0.5 rounded-full bg-muted-foreground/50" />
                              <span>Due {getOrdinalSuffix(bill.deadlineDay)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {bill.expectedAmount ? (
                        <span className="text-sm font-medium">
                          {formatCurrency(bill.expectedAmount, currency)}
                        </span>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          Variable
                        </Badge>
                      )}

                      {!isPaid ? (
                        <Dialog
                          open={payingBillId === bill._id}
                          onOpenChange={(open) => {
                            if (open) openPayDialog(bill);
                            else setPayingBillId(null);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2">
                              Pay
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[320px]">
                            <DialogHeader>
                              <DialogTitle className="text-base">Mark as Paid</DialogTitle>
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
                                onClick={() => handlePayBill(bill)}
                                className="w-full h-8 text-sm"
                                disabled={!paymentAmount}
                              >
                                Mark as Paid
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-200">
                          <Check className="size-2.5 mr-0.5" />
                          Paid
                        </Badge>
                      )}

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="size-6 text-muted-foreground"
                        onClick={() => setExpandedBillId(isExpanded ? null : bill._id)}
                      >
                        {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="size-6 text-muted-foreground hover:text-destructive"
                        onClick={() => removeBill({ deviceId: deviceId!, id: bill._id })}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded payment history */}
                  {isExpanded && (
                    <div className="border-t bg-muted/30 p-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                        <History className="size-3" />
                        Payment History
                      </div>
                      {bill.payments.length === 0 ? (
                        <div className="text-xs text-muted-foreground text-center py-2">
                          No payments recorded yet
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {bill.payments.slice(0, 5).map((payment) => (
                            <div
                              key={payment._id}
                              className="flex items-center justify-between text-xs bg-background rounded px-2 py-1.5"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">
                                  {new Date(payment.periodStart).toLocaleDateString("en", {
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                                <span className="font-medium">
                                  {formatCurrency(payment.amount, currency)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-muted-foreground">
                                  {new Date(payment.paidAt).toLocaleDateString()}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="size-5 text-muted-foreground hover:text-destructive"
                                  onClick={() => removePayment({ deviceId: deviceId!, id: payment._id })}
                                >
                                  <Trash2 className="size-2.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          {bill.payments.length > 5 && (
                            <div className="text-xs text-muted-foreground text-center">
                              +{bill.payments.length - 5} more payments
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </>
  );
}
