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
import { BILL_CATEGORIES, BILL_FREQUENCIES, getOrdinalSuffix, type BillFrequency } from "@/lib/utils";
import type { NewBill } from "@/types/bills";

interface AddBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: NewBill;
  onBillChange: (bill: NewBill) => void;
  onSubmit: () => void;
}

export function AddBillDialog({ open, onOpenChange, bill, onBillChange, onSubmit }: AddBillDialogProps) {
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
          <DialogTitle className="text-base">Add Bill</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input
              placeholder="Electricity, Internet..."
              value={bill.name}
              onChange={(e) => onBillChange({ ...bill, name: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <Select value={bill.category} onValueChange={(v) => onBillChange({ ...bill, category: v })}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BILL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-sm">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Frequency</Label>
            <Select
              value={bill.frequency}
              onValueChange={(v) => onBillChange({ ...bill, frequency: v as BillFrequency })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BILL_FREQUENCIES.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value} className="text-sm">
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Expected Amount (optional)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="Leave empty for variable"
              value={bill.expectedAmount}
              onChange={(e) => onBillChange({ ...bill, expectedAmount: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Payment Deadline Day (optional)</Label>
            <Select value={bill.deadlineDay} onValueChange={(v) => onBillChange({ ...bill, deadlineDay: v })}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="No deadline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-sm">
                  No deadline
                </SelectItem>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day} value={String(day)} className="text-sm">
                    {getOrdinalSuffix(day)} of the period
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Reminder Days Before</Label>
            <Input
              type="number"
              min="1"
              max="14"
              value={bill.reminderDaysBefore}
              onChange={(e) => onBillChange({ ...bill, reminderDaysBefore: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <Button onClick={onSubmit} className="w-full h-8 text-sm">
            Add Bill
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
