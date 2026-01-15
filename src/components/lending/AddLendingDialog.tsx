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
import { Plus, Minus } from "lucide-react";
import type { Person, NewLending } from "@/types/lending";

interface AddLendingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lending: NewLending;
  onLendingChange: (lending: NewLending) => void;
  onSubmit: () => void;
  people: Person[];
}

export function AddLendingDialog({
  open,
  onOpenChange,
  lending,
  onLendingChange,
  onSubmit,
  people,
}: AddLendingDialogProps) {
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
          <DialogTitle className="text-base">Record Transaction</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Person</Label>
            <Select value={lending.personId} onValueChange={(v) => onLendingChange({ ...lending, personId: v })}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select person" />
              </SelectTrigger>
              <SelectContent>
                {people.map((person) => (
                  <SelectItem key={person._id} value={person._id} className="text-sm">
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={!lending.isRepayment ? "default" : "outline"}
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => onLendingChange({ ...lending, isRepayment: false })}
              >
                <Plus className="size-3 mr-1" />
                Lent
              </Button>
              <Button
                type="button"
                variant={lending.isRepayment ? "default" : "outline"}
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => onLendingChange({ ...lending, isRepayment: true })}
              >
                <Minus className="size-3 mr-1" />
                Paid back
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Amount</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={lending.amount}
              onChange={(e) => onLendingChange({ ...lending, amount: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Note (optional)</Label>
            <Input
              placeholder="For dinner, etc."
              value={lending.note}
              onChange={(e) => onLendingChange({ ...lending, note: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <Button onClick={onSubmit} className="w-full h-8 text-sm" disabled={!lending.personId}>
            Record
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
