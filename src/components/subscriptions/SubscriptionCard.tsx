import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";

interface Subscription {
  _id: Id<"expenses">;
  name: string;
  amount: number;
  category: string;
  dayOfMonth?: number;
}

interface SubscriptionCardProps {
  subscription: Subscription;
  currency: string;
  onRemove: () => void;
}

export function SubscriptionCard({ subscription, currency, onRemove }: SubscriptionCardProps) {
  return (
    <Card className="p-2.5 flex flex-row items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <Badge
          variant="outline"
          className="text-[10px] shrink-0 bg-indigo-500/10 text-indigo-600 border-indigo-200"
        >
          <Calendar className="size-2.5 mr-1" />
          {subscription.dayOfMonth ?? 1}
        </Badge>
        <div className="min-w-0">
          <div className="text-sm truncate">{subscription.name}</div>
          <div className="text-[10px] text-muted-foreground">{subscription.category}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-medium">{formatCurrency(subscription.amount, currency)}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-6 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
    </Card>
  );
}
