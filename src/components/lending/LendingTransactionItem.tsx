import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { LendingTransaction } from "@/types/lending";

interface LendingTransactionItemProps {
  transaction: LendingTransaction;
  currency: string;
  onRemove: () => void;
}

export function LendingTransactionItem({ transaction, currency, onRemove }: LendingTransactionItemProps) {
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <span>{transaction.date}</span>
        {transaction.note && <span>- {transaction.note}</span>}
      </div>
      <div className="flex items-center gap-1">
        <span className={transaction.amount > 0 ? "text-red-600" : "text-green-600"}>
          {transaction.amount > 0 ? "-" : "+"}
          {formatCurrency(Math.abs(transaction.amount), currency)}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-5 text-muted-foreground/50 hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="size-2.5" />
        </Button>
      </div>
    </div>
  );
}
