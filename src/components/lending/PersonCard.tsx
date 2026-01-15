import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { LendingTransactionItem } from "./LendingTransactionItem";
import type { PersonWithBalance, LendingTransaction } from "@/types/lending";

interface PersonCardProps {
  person: PersonWithBalance;
  transactions: LendingTransaction[];
  currency: string;
  onRemovePerson: () => void;
  onRemoveTransaction: (transactionId: string) => void;
}

export function PersonCard({
  person,
  transactions,
  currency,
  onRemovePerson,
  onRemoveTransaction,
}: PersonCardProps) {
  return (
    <Card className="p-2.5 block">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-full bg-muted flex items-center justify-center">
            <User className="size-3.5 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium">{person.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              person.balance > 0
                ? "bg-orange-500/10 text-orange-600 border-orange-200"
                : person.balance < 0
                  ? "bg-green-500/10 text-green-600 border-green-200"
                  : ""
            }
          >
            {person.balance > 0 ? `owes ${formatCurrency(person.balance, currency)}` : "settled"}
          </Badge>
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-6 text-muted-foreground hover:text-destructive"
            onClick={onRemovePerson}
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="border-t pt-2 mt-2 space-y-1">
          {transactions.slice(0, 3).map((transaction) => (
            <LendingTransactionItem
              key={transaction._id}
              transaction={transaction}
              currency={currency}
              onRemove={() => onRemoveTransaction(transaction._id)}
            />
          ))}
          {transactions.length > 3 && (
            <div className="text-[10px] text-muted-foreground text-center">+{transactions.length - 3} more</div>
          )}
        </div>
      )}
    </Card>
  );
}
