import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { getToday } from "@/lib/date";
import { useState } from "react";
import { HandCoins } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Id } from "../../../convex/_generated/dataModel";

import { PersonCard, AddPersonDialog, AddLendingDialog } from "@/components/lending";
import type { NewLending, PersonWithBalance, LendingTransaction } from "@/types/lending";

export const Route = createFileRoute("/_app/lending")({
  component: LendingView,
});

function LendingView() {
  const { deviceId, currency } = useAuth();
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [isAddLendingOpen, setIsAddLendingOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [newLending, setNewLending] = useState<NewLending>({
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
      date: getToday(),
    });

    setNewLending({ personId: "", amount: "", note: "", isRepayment: false });
    setIsAddLendingOpen(false);
  };

  const totalOwed = Object.values(balances ?? {}).reduce((s, v) => s + (v > 0 ? v : 0), 0);

  const getPeopleWithBalances = (): PersonWithBalance[] => {
    return (people ?? []).map((person) => ({
      ...person,
      balance: balances?.[person._id] ?? 0,
    }));
  };

  const getPersonTransactions = (personId: Id<"people">): LendingTransaction[] => {
    return (lendings ?? [])
      .filter((l) => l.personId === personId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
              {formatCurrency(totalOwed, currency)} owed to you
            </span>
          </div>
          <div className="flex gap-1">
            <AddPersonDialog
              open={isAddPersonOpen}
              onOpenChange={setIsAddPersonOpen}
              name={newPersonName}
              onNameChange={setNewPersonName}
              onSubmit={handleAddPerson}
            />

            <AddLendingDialog
              open={isAddLendingOpen}
              onOpenChange={setIsAddLendingOpen}
              lending={newLending}
              onLendingChange={setNewLending}
              onSubmit={handleAddLending}
              people={people ?? []}
            />
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
            peopleWithBalances.map((person) => (
              <PersonCard
                key={person._id}
                person={person}
                transactions={getPersonTransactions(person._id)}
                currency={currency}
                onRemovePerson={() => removePerson({ deviceId: deviceId!, id: person._id })}
                onRemoveTransaction={(transactionId) =>
                  removeLending({ deviceId: deviceId!, id: transactionId as Id<"lending"> })
                }
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
