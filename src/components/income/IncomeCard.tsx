import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw } from "lucide-react";
import { INCOME_SOURCE_COLORS, INCOME_SOURCE_ICONS } from "@/constants/categories";
import { formatCurrency, getOrdinalSuffix, cn } from "@/lib/utils";
import type { AdditionalIncome } from "@/types/income";

interface IncomeCardProps {
  income: AdditionalIncome;
  currency: string;
  onDelete: (id: AdditionalIncome["_id"]) => void;
}

export function IncomeCard({ income, currency, onDelete }: IncomeCardProps) {
  const Icon = INCOME_SOURCE_ICONS[income.source] ?? INCOME_SOURCE_ICONS.Other;
  const colorClasses = INCOME_SOURCE_COLORS[income.source] ?? INCOME_SOURCE_COLORS.Other;

  return (
    <div className="flex items-center justify-between py-2 px-1 group">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className={cn("p-1.5 rounded-md", colorClasses)}>
          <Icon className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate">{income.name}</span>
            {income.type === "recurring" && (
              <RefreshCw className="size-3 text-muted-foreground shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", colorClasses)}>
              {income.source}
            </Badge>
            {income.type === "recurring" && income.dayOfMonth && (
              <span>Every {getOrdinalSuffix(income.dayOfMonth)}</span>
            )}
            {income.type === "one-time" && income.date && (
              <span>{new Date(income.date + "T00:00:00").toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-green-600">
          +{formatCurrency(income.amount, currency)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onDelete(income._id)}
        >
          <Trash2 className="size-3 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}
