"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AvailabilityCalendar } from "./availability-calendar";
import { createReservation } from "@/lib/actions/reservations";
import type { Location } from "@/db/schema";

interface ReservationBlock {
  id: string;
  pickupDate: Date;
  returnDate: Date;
  status: string;
}

interface ReservationCardProps {
  toolId: string;
  toolName: string;
  toolStatus: string;
  location: Location | null;
  reservations: ReservationBlock[];
  // In a real app, this would come from auth
  userId?: string;
}

type Step = "dates" | "times" | "confirm";

const TIME_SLOTS = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
];

export function ReservationCard({
  toolId,
  toolName,
  toolStatus,
  location,
  reservations,
  userId,
}: ReservationCardProps) {
  const [step, setStep] = useState<Step>("dates");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [pickupTime, setPickupTime] = useState<string>("");
  const [returnTime, setReturnTime] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const isAvailable = toolStatus === "available";
  const hasValidDates = dateRange?.from && dateRange?.to;

  const handleReserve = async () => {
    if (!hasValidDates || !userId) return;

    startTransition(async () => {
      const response = await createReservation({
        toolId,
        userId,
        locationId: location?.id,
        pickupDate: dateRange.from!.toISOString(),
        pickupTime: pickupTime || undefined,
        returnDate: dateRange.to!.toISOString(),
        returnTime: returnTime || undefined,
      });

      if (response.success) {
        setResult({ success: true, message: "Reservation confirmed! Check your email for details." });
      } else {
        setResult({ success: false, message: response.error || "Failed to create reservation" });
      }
    });
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-6 px-2">
      {(["dates", "times", "confirm"] as Step[]).map((s, i) => (
        <div key={s} className="flex items-center">
          <div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all",
              step === s
                ? "bg-blue-600 text-white"
                : i < (["dates", "times", "confirm"] as Step[]).indexOf(step)
                ? "bg-blue-100 text-blue-600"
                : "bg-slate-100 text-slate-400"
            )}
          >
            {i + 1}
          </div>
          {i < 2 && (
            <div
              className={cn(
                "w-12 h-0.5 mx-2",
                i < (["dates", "times", "confirm"] as Step[]).indexOf(step)
                  ? "bg-blue-200"
                  : "bg-slate-100"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );

  if (result) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
        <div className={cn(
          "flex flex-col items-center text-center py-8",
          result.success ? "text-green-600" : "text-red-600"
        )}>
          {result.success ? (
            <CheckCircle2 className="h-16 w-16 mb-4" />
          ) : (
            <AlertCircle className="h-16 w-16 mb-4" />
          )}
          <h3 className="text-xl font-semibold mb-2">
            {result.success ? "Reservation Confirmed!" : "Reservation Failed"}
          </h3>
          <p className="text-sm text-slate-500 max-w-xs">{result.message}</p>
          {result.success && (
            <button
              onClick={() => {
                setResult(null);
                setStep("dates");
                setDateRange(undefined);
                setPickupTime("");
                setReturnTime("");
              }}
              className="mt-6 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Make Another Reservation
            </button>
          )}
          {!result.success && (
            <button
              onClick={() => setResult(null)}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!isAvailable) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
        <div className="flex flex-col items-center text-center py-8">
          <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Currently Unavailable
          </h3>
          <p className="text-sm text-slate-500 max-w-xs">
            This tool is currently {toolStatus.replace("_", " ")}. Check back later or browse similar tools.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <h3 className="text-lg font-semibold text-white">Reserve This Tool</h3>
        <p className="text-sm text-blue-100">Select dates and times for your reservation</p>
      </div>

      <div className="p-6">
        {renderStepIndicator()}

        {/* Step 1: Date Selection */}
        {step === "dates" && (
          <div className="space-y-4">
            <AvailabilityCalendar
              toolId={toolId}
              reservations={reservations}
              selectedRange={dateRange}
              onRangeSelect={setDateRange}
            />
            
            {hasValidDates && (
              <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Pickup</span>
                  <span className="font-medium text-slate-900">
                    {format(dateRange.from!, "EEE, MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Return</span>
                  <span className="font-medium text-slate-900">
                    {format(dateRange.to!, "EEE, MMM d, yyyy")}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => setStep("times")}
              disabled={!hasValidDates}
              className={cn(
                "w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2",
                hasValidDates
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step 2: Time Selection */}
        {step === "times" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Pickup Time
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((time) => (
                  <button
                    key={`pickup-${time}`}
                    onClick={() => setPickupTime(time)}
                    className={cn(
                      "py-2 px-3 rounded-lg text-sm font-medium transition-all",
                      pickupTime === time
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Return Time
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((time) => (
                  <button
                    key={`return-${time}`}
                    onClick={() => setReturnTime(time)}
                    className={cn(
                      "py-2 px-3 rounded-lg text-sm font-medium transition-all",
                      returnTime === time
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("dates")}
                className="flex-1 py-3 rounded-xl font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
              >
                Back
              </button>
              <button
                onClick={() => setStep("confirm")}
                className="flex-1 py-3 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === "confirm" && hasValidDates && (
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-xl p-5 space-y-4">
              <h4 className="font-semibold text-slate-900">Reservation Summary</h4>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CalendarDays className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {format(dateRange.from!, "EEEE, MMMM d")}
                      {" → "}
                      {format(dateRange.to!, "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-xs text-slate-500">
                      {Math.ceil((dateRange.to!.getTime() - dateRange.from!.getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                </div>

                {(pickupTime || returnTime) && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {pickupTime && `Pickup: ${pickupTime}`}
                        {pickupTime && returnTime && " · "}
                        {returnTime && `Return: ${returnTime}`}
                      </p>
                    </div>
                  </div>
                )}

                {location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{location.name}</p>
                      {location.address && (
                        <p className="text-xs text-slate-500">{location.address}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!userId && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Sign in required</p>
                  <p className="text-xs text-amber-600 mt-1">
                    You need to be signed in to complete this reservation.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep("times")}
                className="flex-1 py-3 rounded-xl font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleReserve}
                disabled={isPending || !userId}
                className={cn(
                  "flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2",
                  userId
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                )}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Reserve Tool
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
