import { Card } from "@/components/ui/card";
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
import { AlertTriangle } from "lucide-react";
import { formatCurrency, getOrdinalSuffix } from "@/lib/utils";

interface UnpaidBill {
  bill: {
    _id: string;
    name: string;
    expectedAmount?: number;
    deadlineDay?: number;
    frequency: string;
  };
  daysUntilDeadline: number;
}

interface BillWarningCardProps {
  item: UnpaidBill;
  currency: string;
  periodLabel: string;
  isPayDialogOpen: boolean;
  paymentAmount: string;
  paymentDate: string;
  onOpenPayDialog: () => void;
  onClosePayDialog: () => void;
  onPaymentAmountChange: (amount: string) => void;
  onPaymentDateChange: (date: string) => void;
  onPay: () => void;
}

export function BillWarningCard({
  item,
  currency,
  periodLabel,
  isPayDialogOpen,
  paymentAmount,
  paymentDate,
  onOpenPayDialog,
  onClosePayDialog,
  onPaymentAmountChange,
  onPaymentDateChange,
  onPay,
}: BillWarningCardProps) {
  const isOverdue = item.daysUntilDeadline < 0;

  return (
    <Card
      className={`p-3 border-l-4 ${
        isOverdue ? "border-l-red-500 bg-red-500/5" : "border-l-amber-500 bg-amber-500/5"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div
            className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
              isOverdue ? "bg-red-500/10 text-red-600" : "bg-amber-500/10 text-amber-600"
            }`}
          >
            <AlertTriangle className="size-4" />
          </div>
          <div>
            <div className="text-sm font-medium">{item.bill.name}</div>
            <div className="text-xs text-muted-foreground">
              {isOverdue ? (
                <span className="text-red-600">
                  Overdue by {Math.abs(item.daysUntilDeadline)} day
                  {Math.abs(item.daysUntilDeadline) !== 1 ? "s" : ""}
                </span>
              ) : item.daysUntilDeadline === 0 ? (
                <span className="text-amber-600">Due today</span>
              ) : (
                <span>
                  Due in {item.daysUntilDeadline} day{item.daysUntilDeadline !== 1 ? "s" : ""} (
                  {getOrdinalSuffix(item.bill.deadlineDay!)})
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
          open={isPayDialogOpen}
          onOpenChange={(open) => {
            if (open) onOpenPayDialog();
            else onClosePayDialog();
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
      </div>
    </Card>
  );
}
