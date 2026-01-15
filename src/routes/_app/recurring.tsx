import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Calendar, Plus, RefreshCw, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export const Route = createFileRoute("/_app/recurring")({
  component: RecurringView,
});

const CATEGORIES = ["Netflix", "Spotify", "Gym", "Rent", "Insurance", "Utilities", "Other"];

function RecurringView() {
  const { userId } = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newRecurring, setNewRecurring] = useState({
    name: "",
    amount: "",
    category: "Other",
    dayOfMonth: "1",
  });

  const { data: recurringExpenses } = useQuery({
    ...convexQuery(api.expenses.listByType, userId ? { userId, type: "recurring" as const } : "skip"),
    enabled: !!userId,
  });
  const addExpense = useMutation(api.expenses.add);
  const removeExpense = useMutation(api.expenses.remove);

  const totalMonthly = recurringExpenses?.reduce((s, e) => s + e.amount, 0) ?? 0;

  const handleAddRecurring = () => {
    if (!userId || !newRecurring.name || !newRecurring.amount) return;

    addExpense({
      userId,
      name: newRecurring.name,
      amount: parseFloat(newRecurring.amount),
      category: newRecurring.category,
      type: "recurring",
      date: "",
      dayOfMonth: parseInt(newRecurring.dayOfMonth),
    });

    setNewRecurring({ name: "", amount: "", category: "Other", dayOfMonth: "1" });
    setIsAddOpen(false);
  };

  const sortedExpenses = [...(recurringExpenses ?? [])].sort(
    (a, b) => (a.dayOfMonth ?? 0) - (b.dayOfMonth ?? 0)
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium">Monthly Recurring</span>
            <span className="text-xs text-muted-foreground ml-2">
              ${totalMonthly.toFixed(2)}/mo
            </span>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-7 text-xs">
                <Plus className="size-3" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[320px]">
              <DialogHeader>
                <DialogTitle className="text-base">Add Recurring Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Name</Label>
                  <Input
                    placeholder="Netflix, Gym..."
                    value={newRecurring.name}
                    onChange={(e) => setNewRecurring({ ...newRecurring, name: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newRecurring.amount}
                    onChange={(e) => setNewRecurring({ ...newRecurring, amount: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Category</Label>
                  <Select
                    value={newRecurring.category}
                    onValueChange={(v) => setNewRecurring({ ...newRecurring, category: v })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
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
                    value={newRecurring.dayOfMonth}
                    onValueChange={(v) => setNewRecurring({ ...newRecurring, dayOfMonth: v })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={String(day)} className="text-sm">
                          {day}
                          {day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddRecurring} className="w-full h-8 text-sm">
                  Add Recurring
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {sortedExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <RefreshCw className="size-8 mx-auto mb-2 opacity-50" />
              No recurring expenses yet
            </div>
          ) : (
            sortedExpenses.map((expense) => (
              <Card key={expense._id} className="p-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge
                    variant="outline"
                    className="text-[10px] shrink-0 bg-indigo-500/10 text-indigo-600 border-indigo-200"
                  >
                    <Calendar className="size-2.5 mr-1" />
                    {expense.dayOfMonth ?? 1}
                  </Badge>
                  <div className="min-w-0">
                    <div className="text-sm truncate">{expense.name}</div>
                    <div className="text-[10px] text-muted-foreground">{expense.category}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-medium">${expense.amount.toFixed(2)}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-6 text-muted-foreground hover:text-destructive"
                    onClick={() => removeExpense({ id: expense._id })}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
