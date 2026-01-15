import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Check,
  Clock,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { formatCurrency, getOrdinalSuffix, BILL_FREQUENCIES } from "@/lib/utils";
import { PaymentHistory } from "./PaymentHistory";
import type { BillPayment } from "@/types/bills";

interface BillCardProps {
  bill: {
    _id: string;
    name: string;
    category: string;
    frequency: string;
    expectedAmount?: number;
    deadlineDay?: number;
    payments: BillPayment[];
    trend?: {
      direction: "up" | "down" | "stable" | "same";
      percentage: number;
    } | null;
  };
  currency: string;
  isPaid: boolean;
  isExpanded: boolean;
  periodLabel: string;
  isPayDialogOpen: boolean;
  paymentAmount: string;
  paymentDate: string;
  onToggleExpand: () => void;
  onOpenPayDialog: () => void;
  onClosePayDialog: () => void;
  onPaymentAmountChange: (amount: string) => void;
  onPaymentDateChange: (date: string) => void;
  onPay: () => void;
  onRemove: () => void;
  onRemovePayment: (paymentId: string) => void;
}

export function BillCard({
  bill,
  currency,
  isPaid,
  isExpanded,
  periodLabel,
  isPayDialogOpen,
  paymentAmount,
  paymentDate,
  onToggleExpand,
  onOpenPayDialog,
  onClosePayDialog,
  onPaymentAmountChange,
  onPaymentDateChange,
  onPay,
  onRemove,
  onRemovePayment,
}: BillCardProps) {
  const frequencyLabel =
    BILL_FREQUENCIES.find((f) => f.value === bill.frequency)?.label ?? bill.frequency;

  return (
    <Card className="overflow-hidden">
      <div className="p-2.5 flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Status indicator */}
          <div
            className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
              isPaid ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"
            }`}
          >
            {isPaid ? <Check className="size-4" /> : <Clock className="size-4" />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium truncate">{bill.name}</span>
              {bill.trend && bill.trend.direction !== "same" && bill.trend.direction !== "stable" && (
                <span
                  className={`flex items-center text-[10px] ${
                    bill.trend.direction === "up" ? "text-red-500" : "text-green-500"
                  }`}
                >
                  {bill.trend.direction === "up" ? (
                    <TrendingUp className="size-2.5" />
                  ) : (
                    <TrendingDown className="size-2.5" />
                  )}
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
            <span className="text-sm font-medium">{formatCurrency(bill.expectedAmount, currency)}</span>
          ) : (
            <Badge variant="outline" className="text-[10px]">
              Variable
            </Badge>
          )}

          {!isPaid ? (
            <Dialog
              open={isPayDialogOpen}
              onOpenChange={(open) => {
                if (open) onOpenPayDialog();
                else onClosePayDialog();
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
                    Period: <span className="text-foreground font-medium">{periodLabel}</span>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => onPaymentAmountChange(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Payment Date</Label>
                    <Input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => onPaymentDateChange(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <Button onClick={onPay} className="w-full h-8 text-sm" disabled={!paymentAmount}>
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

          <Button variant="ghost" size="icon-sm" className="size-6 text-muted-foreground" onClick={onToggleExpand}>
            {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            className="size-6 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>

      {/* Expanded payment history */}
      {isExpanded && (
        <PaymentHistory payments={bill.payments} currency={currency} onRemovePayment={onRemovePayment} />
      )}
    </Card>
  );
}
