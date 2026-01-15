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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { SUBSCRIPTION_CATEGORIES } from "@/constants/categories";
import { getOrdinalSuffix } from "@/lib/utils";
import type { NewRecurring } from "@/types/expenses";

interface AddSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: NewRecurring;
  onSubscriptionChange: (subscription: NewRecurring) => void;
  onSubmit: () => void;
}

export function AddSubscriptionDialog({
  open,
  onOpenChange,
  subscription,
  onSubscriptionChange,
  onSubmit,
}: AddSubscriptionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              value={subscription.name}
              onChange={(e) => onSubscriptionChange({ ...subscription, name: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Amount</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={subscription.amount}
              onChange={(e) => onSubscriptionChange({ ...subscription, amount: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <Select
              value={subscription.category}
              onValueChange={(v) => onSubscriptionChange({ ...subscription, category: v })}
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
              value={subscription.dayOfMonth}
              onValueChange={(v) => onSubscriptionChange({ ...subscription, dayOfMonth: v })}
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
          <Button onClick={onSubmit} className="w-full h-8 text-sm">
            Add Subscription
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
