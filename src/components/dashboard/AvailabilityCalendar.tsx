"use client";

import { useState, useEffect } from "react";

interface ReservedRange {
  pickupDate: string;
  returnDate: string;
  status: string;
}

interface AvailabilityCalendarProps {
  toolId: string;
  onSelectDates?: (pickup: string, returnDate: string) => void;
  selectedPickup?: string;
  selectedReturn?: string;
}

export default function AvailabilityCalendar({
  toolId,
  onSelectDates,
  selectedPickup,
  selectedReturn,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [reservedRanges, setReservedRanges] = useState<ReservedRange[]>([]);
  const [selectMode, setSelectMode] = useState<"pickup" | "return">("pickup");
  const [localPickup, setLocalPickup] = useState(selectedPickup ?? "");
  const [localReturn, setLocalReturn] = useState(selectedReturn ?? "");

  useEffect(() => {
    const from = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );
    const to = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;

    fetch(`/api/tools/${toolId}/availability?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => setReservedRanges(data.reservations ?? []))
      .catch(() => {});
  }, [toolId, currentMonth]);

  const isReserved = (dateStr: string) =>
    reservedRanges.some((r) => dateStr >= r.pickupDate && dateStr <= r.returnDate);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDow = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const handleDayClick = (dateStr: string) => {
    if (isReserved(dateStr) || dateStr < todayStr) return;

    if (selectMode === "pickup") {
      setLocalPickup(dateStr);
      setLocalReturn("");
      setSelectMode("return");
    } else {
      if (dateStr <= localPickup) return;
      // Check no reserved days between pickup and return
      const hasConflict = reservedRanges.some(
        (r) => r.pickupDate <= dateStr && r.returnDate >= localPickup
      );
      if (hasConflict) return;

      setLocalReturn(dateStr);
      setSelectMode("pickup");
      onSelectDates?.(localPickup, dateStr);
    }
  };

  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  const nextMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="rounded p-1 hover:bg-slate-100 text-slate-600"
        >
          ←
        </button>
        <span className="text-sm font-semibold text-slate-800">
          {monthLabel}
        </span>
        <button
          onClick={nextMonth}
          className="rounded p-1 hover:bg-slate-100 text-slate-600"
        >
          →
        </button>
      </div>

      <div className="mb-1 text-xs text-slate-500">
        {selectMode === "pickup"
          ? "Select pickup date"
          : "Select return date"}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const reserved = isReserved(dateStr);
          const isPast = dateStr < todayStr;
          const isPickup = dateStr === localPickup;
          const isReturn = dateStr === localReturn;
          const inRange =
            localPickup &&
            localReturn &&
            dateStr > localPickup &&
            dateStr < localReturn;

          let cls =
            "py-1.5 rounded text-xs cursor-pointer transition-colors ";
          if (reserved) cls += "bg-red-100 text-red-400 cursor-not-allowed ";
          else if (isPast) cls += "text-slate-300 cursor-not-allowed ";
          else if (isPickup || isReturn)
            cls += "bg-blue-600 text-white font-bold ";
          else if (inRange) cls += "bg-blue-100 text-blue-700 ";
          else cls += "hover:bg-slate-100 text-slate-700 ";

          return (
            <div
              key={day}
              className={cls}
              onClick={() => !isPast && !reserved && handleDayClick(dateStr)}
            >
              {day}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-red-100 border border-red-200" />
          Reserved
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-blue-600" />
          Selected
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-blue-100 border border-blue-200" />
          Range
        </span>
      </div>
    </div>
  );
}
