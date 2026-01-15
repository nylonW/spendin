import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { formatDateString, isToday } from "@/lib/date";

interface WeekCalendarProps {
  weekDates: Date[];
  selectedDate: Date;
  weekTotal: number;
  currency: string;
  getDayTotal: (date: Date) => number;
  onSelectDate: (date: Date) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

export function WeekCalendar({
  weekDates,
  selectedDate,
  weekTotal,
  currency,
  getDayTotal,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
  onToday,
}: WeekCalendarProps) {
  const selectedDateStr = formatDateString(selectedDate);

  return (
    <div className="p-3 border-b shrink-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={onPrevWeek}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onToday} className="text-xs">
            Today
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onNextWeek}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          Week total: <span className="font-medium text-foreground">{formatCurrency(weekTotal, currency)}</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDates.map((date) => {
          const dateStr = formatDateString(date);
          const isSelected = dateStr === selectedDateStr;
          const isTodayDate = isToday(date);
          const dayTotal = getDayTotal(date);
          const hasExpenses = dayTotal > 0;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(date)}
              className={`
                flex flex-col items-center p-1.5 rounded-md transition-colors text-center
                ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"}
                ${isTodayDate && !isSelected ? "ring-1 ring-primary" : ""}
              `}
            >
              <span className="text-[10px] uppercase opacity-70">
                {date.toLocaleDateString("en", { weekday: "short" })}
              </span>
              <span className="text-sm font-medium">{date.getDate()}</span>
              {hasExpenses && (
                <span className={`text-[10px] ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {formatCurrency(dayTotal, currency, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
