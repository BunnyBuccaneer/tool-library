"use client";

import { useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { isSameDay, addDays } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface ReservationBlock {
  id: string;
  pickupDate: Date;
  returnDate: Date;
  status: string;
}

interface AvailabilityCalendarProps {
  toolId: string;
  reservations: ReservationBlock[];
  selectedRange?: DateRange;
  onRangeSelect?: (range: DateRange | undefined) => void;
  className?: string;
}

export function AvailabilityCalendar({
  reservations,
  selectedRange,
  onRangeSelect,
  className,
}: AvailabilityCalendarProps) {
  const [month, setMonth] = useState(new Date());

  // Get all blocked dates from reservations
  const getBlockedDates = (): Date[] => {
    const blocked: Date[] = [];
    reservations.forEach((res) => {
      const start = new Date(res.pickupDate);
      const end = new Date(res.returnDate);
      let current = start;
      while (current <= end) {
        blocked.push(new Date(current));
        current = addDays(current, 1);
      }
    });
    return blocked;
  };

  const blockedDates = getBlockedDates();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if a date is blocked
  const isDateBlocked = (date: Date) => {
    return blockedDates.some((blocked) => isSameDay(blocked, date));
  };

  // Disable past dates and blocked dates
  const disabledDays = [
    { before: today },
    ...blockedDates,
  ];

  const handleSelect = (range: DateRange | undefined) => {
    // Check if the selected range includes any blocked dates
    if (range?.from && range?.to) {
      let current = new Date(range.from);
      while (current <= range.to) {
        if (isDateBlocked(current)) {
          // Don't allow selection that spans blocked dates
          return;
        }
        current = addDays(current, 1);
      }
    }
    onRangeSelect?.(range);
  };

  return (
    <div className={cn("space-y-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm", className)}>
      <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
        <Calendar className="h-4 w-4 text-blue-600" />
        <span>Select your pickup and return dates</span>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-[350px]">
          <DayPicker
  mode="range"
  selected={selectedRange}
  onSelect={handleSelect}
  month={month}
  onMonthChange={setMonth}
  disabled={disabledDays}
  numberOfMonths={1}
  showOutsideDays={false}
  className="p-0"
  classNames={{
    months: "flex flex-col space-y-4",
    month: "space-y-4",
    month_caption: "flex justify-center pt-1 relative items-center mb-2",
    caption_label: "text-sm font-semibold text-slate-900",
    nav: "flex items-center justify-between absolute inset-x-0 top-0 px-1",
    button_previous: cn(
      buttonVariants({ variant: "outline" }),
      "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100"
    ),
    button_next: cn(
      buttonVariants({ variant: "outline" }),
      "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100"
    ),
    month_grid: "w-full border-collapse space-y-1",
    weekdays: "flex justify-between",
    weekday: "text-slate-400 rounded-md w-9 font-medium text-[0.8rem] text-center",
    weeks: "space-y-1",
    week: "flex w-full mt-2 justify-between",
    day: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
    day_button: cn(
      buttonVariants({ variant: "ghost" }),
      "h-9 w-9 p-0 font-normal hover:bg-slate-100 rounded-full text-slate-900"
    ),
    selected: "!bg-blue-600 !text-white hover:!bg-blue-700 rounded-full",
    today: "border-2 border-blue-600 text-slate-900 rounded-full font-semibold",
    outside: "text-slate-300 opacity-50",
    disabled: "text-slate-300 opacity-40 line-through cursor-not-allowed hover:bg-transparent",
    range_middle: "!bg-blue-50 !text-blue-900 hover:!bg-blue-100 !rounded-none",
    range_start: "!bg-blue-600 !text-white !rounded-l-full !rounded-r-none",
    range_end: "!bg-blue-600 !text-white !rounded-r-full !rounded-l-none",
    hidden: "invisible",
  }}
  components={{
    Chevron: ({ orientation }) =>
      orientation === "left" ? (
        <ChevronLeft className="h-4 w-4 text-slate-600" />
      ) : (
        <ChevronRight className="h-4 w-4 text-slate-600" />
      ),
  }}
/>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-blue-600" />
          <span className="text-slate-600 font-medium">Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-slate-100 border border-slate-200 line-through opacity-50" />
          <span className="text-slate-600 font-medium">Unavailable</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-600" />
          <span className="text-slate-600 font-medium">Today</span>
        </div>
      </div>
    </div>
  );
}