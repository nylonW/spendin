import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw, MoreHorizontal, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/constants/categories";
import type { SpendingItem } from "@/types/expenses";

interface SpendingCardProps {
  item: SpendingItem;
  currency: string;
  onRemove: () => void;
}

export function SpendingCard({ item, currency, onRemove }: SpendingCardProps) {
  const isLending = item.type === "lending";
  const isRecurring = item.type === "recurring";
  const isBill = item.type === "bill";
  const category = isLending ? "Lending" : item.category;
  const Icon = CATEGORY_ICONS[isLending ? "Lending" : item.category] || MoreHorizontal;
  const colorClass = CATEGORY_COLORS[isLending ? "Lending" : item.category] || CATEGORY_COLORS.Other;

  return (
    <Card className="p-3 flex flex-row items-center gap-3 transition-colors hover:bg-muted/50">
      {/* Icon Box */}
      <div className={`size-10 rounded-lg flex items-center justify-center border shrink-0 ${colorClass}`}>
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
          {isBill && (
            <>
              <span className="size-0.5 rounded-full bg-muted-foreground/50" />
              <span className="flex items-center gap-0.5">
                <Receipt className="size-2.5" />
                Bill
              </span>
            </>
          )}
        </div>
      </div>

      {/* Amount & Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-semibold tabular-nums">{formatCurrency(item.amount, currency)}</span>
        {!isRecurring ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 -mr-1"
            onClick={onRemove}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : (
          <div className="size-7" /> /* Spacer for alignment */
        )}
      </div>
    </Card>
  );
}
