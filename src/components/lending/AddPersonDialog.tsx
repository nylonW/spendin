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
import { UserPlus } from "lucide-react";

interface AddPersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
}

export function AddPersonDialog({ open, onOpenChange, name, onNameChange, onSubmit }: AddPersonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <UserPlus className="size-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[320px]">
        <DialogHeader>
          <DialogTitle className="text-base">Add Person</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input
              placeholder="John, Sarah..."
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            />
          </div>
          <Button onClick={onSubmit} className="w-full h-8 text-sm">
            Add Person
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
