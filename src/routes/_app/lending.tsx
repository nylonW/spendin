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
import { HandCoins, Minus, Plus, Trash2, User, UserPlus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Id } from "../../../convex/_generated/dataModel";

export const Route = createFileRoute("/_app/lending")({
  component: LendingView,
});

function LendingView() {
  const { deviceId, currencySymbol } = useAuth();
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [isAddLendingOpen, setIsAddLendingOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [newLending, setNewLending] = useState({
    personId: "",
    amount: "",
    note: "",
    isRepayment: false,
  });

  const { data: people } = useQuery({
    ...convexQuery(api.people.list, deviceId ? { deviceId } : "skip"),
    enabled: !!deviceId,
  });
  const { data: lendings } = useQuery({
    ...convexQuery(api.lending.list, deviceId ? { deviceId } : "skip"),
    enabled: !!deviceId,
  });
  const { data: balances } = useQuery({
    ...convexQuery(api.lending.getBalanceByPerson, deviceId ? { deviceId } : "skip"),
    enabled: !!deviceId,
  });

  const addPerson = useMutation(api.people.add);
  const removePerson = useMutation(api.people.remove);
  const addLending = useMutation(api.lending.add);
  const removeLending = useMutation(api.lending.remove);

  const handleAddPerson = () => {
    if (!deviceId || !newPersonName.trim()) return;
    addPerson({ deviceId, name: newPersonName.trim() });
    setNewPersonName("");
    setIsAddPersonOpen(false);
  };

  const handleAddLending = () => {
    if (!deviceId || !newLending.personId || !newLending.amount) return;

    const amount = parseFloat(newLending.amount);
    addLending({
      deviceId,
      personId: newLending.personId as Id<"people">,
      amount: newLending.isRepayment ? -amount : amount,
      note: newLending.note || undefined,
      date: new Date().toISOString().split("T")[0],
    });

    setNewLending({ personId: "", amount: "", note: "", isRepayment: false });
    setIsAddLendingOpen(false);
  };

  const totalOwed = Object.values(balances ?? {}).reduce(
    (s, v) => s + (v > 0 ? v : 0),
    0
  );

  const getPeopleWithBalances = () => {
    return (people ?? []).map((person) => ({
      ...person,
      balance: balances?.[person._id] ?? 0,
    }));
  };

  const peopleWithBalances = getPeopleWithBalances();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium">Money Lent</span>
            <span className="text-xs text-muted-foreground ml-2">
              {currencySymbol}{totalOwed.toFixed(2)} owed to you
            </span>
          </div>
          <div className="flex gap-1">
            <Dialog open={isAddPersonOpen} onOpenChange={setIsAddPersonOpen}>
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
                      value={newPersonName}
                      onChange={(e) => setNewPersonName(e.target.value)}
                      className="h-8 text-sm"
                      onKeyDown={(e) => e.key === "Enter" && handleAddPerson()}
                    />
                  </div>
                  <Button onClick={handleAddPerson} className="w-full h-8 text-sm">
                    Add Person
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddLendingOpen} onOpenChange={setIsAddLendingOpen}>
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
                    <Select
                      value={newLending.personId}
                      onValueChange={(v) => setNewLending({ ...newLending, personId: v })}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select person" />
                      </SelectTrigger>
                      <SelectContent>
                        {(people ?? []).map((person) => (
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
                        variant={!newLending.isRepayment ? "default" : "outline"}
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => setNewLending({ ...newLending, isRepayment: false })}
                      >
                        <Plus className="size-3 mr-1" />
                        Lent
                      </Button>
                      <Button
                        type="button"
                        variant={newLending.isRepayment ? "default" : "outline"}
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => setNewLending({ ...newLending, isRepayment: true })}
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
                      value={newLending.amount}
                      onChange={(e) => setNewLending({ ...newLending, amount: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Note (optional)</Label>
                    <Input
                      placeholder="For dinner, etc."
                      value={newLending.note}
                      onChange={(e) => setNewLending({ ...newLending, note: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <Button
                    onClick={handleAddLending}
                    className="w-full h-8 text-sm"
                    disabled={!newLending.personId}
                  >
                    Record
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {peopleWithBalances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <HandCoins className="size-8 mx-auto mb-2 opacity-50" />
              No people added yet
            </div>
          ) : (
            peopleWithBalances.map((person) => {
              const personLendings = (lendings ?? [])
                .filter((l) => l.personId === person._id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

              return (
                <Card key={person._id} className="p-2.5">
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
                        {person.balance > 0
                          ? `owes ${currencySymbol}${person.balance.toFixed(2)}`
                          : person.balance < 0
                            ? `settled`
                            : "settled"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="size-6 text-muted-foreground hover:text-destructive"
                        onClick={() => removePerson({ deviceId: deviceId!, id: person._id })}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>

                  {personLendings.length > 0 && (
                    <div className="border-t pt-2 mt-2 space-y-1">
                      {personLendings.slice(0, 3).map((lending) => (
                        <div
                          key={lending._id}
                          className="flex items-center justify-between text-xs text-muted-foreground"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{lending.date}</span>
                            {lending.note && <span>- {lending.note}</span>}
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className={lending.amount > 0 ? "text-red-600" : "text-green-600"}
                            >
                              {lending.amount > 0 ? "-" : "+"}{currencySymbol}{Math.abs(lending.amount).toFixed(2)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-5 text-muted-foreground/50 hover:text-destructive"
                              onClick={() => removeLending({ deviceId: deviceId!, id: lending._id })}
                            >
                              <Trash2 className="size-2.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {personLendings.length > 3 && (
                        <div className="text-[10px] text-muted-foreground text-center">
                          +{personLendings.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
