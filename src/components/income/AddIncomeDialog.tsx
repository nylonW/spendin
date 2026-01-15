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
import { INCOME_SOURCES } from "@/constants/categories";
import { getOrdinalSuffix } from "@/lib/utils";
import type { NewAdditionalIncome } from "@/types/income";

interface AddIncomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  income: NewAdditionalIncome;
  onIncomeChange: (income: NewAdditionalIncome) => void;
  onSubmit: () => void;
}

export function AddIncomeDialog({
  open,
  onOpenChange,
  income,
  onIncomeChange,
  onSubmit,
}: AddIncomeDialogProps) {
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
          <DialogTitle className="text-base">Add Income</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Type</Label>
            <Select
              value={income.type}
              onValueChange={(v) =>
                onIncomeChange({ ...income, type: v as "one-time" | "recurring" })
              }
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one-time" className="text-sm">
                  One-time
                </SelectItem>
                <SelectItem value="recurring" className="text-sm">
                  Recurring (monthly)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Input
              placeholder="Freelance work, Gift from friend..."
              value={income.name}
              onChange={(e) => onIncomeChange({ ...income, name: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Amount</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={income.amount}
              onChange={(e) => onIncomeChange({ ...income, amount: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Source</Label>
            <Select
              value={income.source}
              onValueChange={(v) => onIncomeChange({ ...income, source: v })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INCOME_SOURCES.map((source) => (
                  <SelectItem key={source} value={source} className="text-sm">
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {income.type === "recurring" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Day of Month</Label>
              <Select
                value={income.dayOfMonth}
                onValueChange={(v) => onIncomeChange({ ...income, dayOfMonth: v })}
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
          )}
          <Button onClick={onSubmit} className="w-full h-8 text-sm">
            Add Income
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
