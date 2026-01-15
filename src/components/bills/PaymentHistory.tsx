import { Button } from "@/components/ui/button";
import { History, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { BillPayment } from "@/types/bills";

interface PaymentHistoryProps {
  payments: BillPayment[];
  currency: string;
  onRemovePayment: (paymentId: string) => void;
}

export function PaymentHistory({ payments, currency, onRemovePayment }: PaymentHistoryProps) {
  return (
    <div className="border-t bg-muted/30 p-2.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <History className="size-3" />
        Payment History
      </div>
      {payments.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-2">No payments recorded yet</div>
      ) : (
        <div className="space-y-1.5">
          {payments.slice(0, 5).map((payment) => (
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
                <span className="font-medium">{formatCurrency(payment.amount, currency)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">{new Date(payment.paidAt).toLocaleDateString()}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="size-5 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemovePayment(payment._id)}
                >
                  <Trash2 className="size-2.5" />
                </Button>
              </div>
            </div>
          ))}
          {payments.length > 5 && (
            <div className="text-xs text-muted-foreground text-center">+{payments.length - 5} more payments</div>
          )}
        </div>
      )}
    </div>
  );
}
