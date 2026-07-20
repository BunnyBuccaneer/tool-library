"use client";

import { useState } from "react";

interface Tool {
  id: string;
  name: string;
  status: string;
}

interface ReserveToolsButtonProps {
  projectId: string;
  projectName: string;
  tools: Tool[];
}

export function ReserveToolsButton({
  projectId,
  projectName,
  tools,
}: ReserveToolsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>(
    tools.filter((t) => t.status === "available").map((t) => t.id)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const availableTools = tools.filter((t) => t.status === "available");
  const unavailableTools = tools.filter((t) => t.status !== "available");

  const toggleTool = (toolId: string) => {
    setSelectedToolIds((prev) =>
      prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedToolIds.length === 0) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/reservations/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          toolIds: selectedToolIds,
          pickupDate,
          returnDate,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({
          success: true,
          message: `Successfully reserved ${data.count} tool(s) for "${projectName}"!`,
        });
        // Reset form after success
        setTimeout(() => {
          setIsOpen(false);
          setResult(null);
        }, 3000);
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to create reservations",
        });
      }
    } catch {
      setResult({
        success: false,
        message: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split("T")[0];

  if (availableTools.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-3">
          <svg
            className="mt-0.5 h-5 w-5 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h3 className="font-semibold text-amber-800">Tools Unavailable</h3>
            <p className="mt-1 text-sm text-amber-700">
              All required tools are currently unavailable. Check back later or
              contact us to get on a waitlist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30"
      >
        Reserve All Tools ({availableTools.length} available)
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => !isSubmitting && setIsOpen(false)}
          />

          {/* Modal content */}
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-slate-900">Reserve Tools</h2>
            <p className="mt-1 text-sm text-slate-600">
              For project: <span className="font-medium">{projectName}</span>
            </p>

            {result ? (
              <div
                className={`mt-6 rounded-xl p-4 ${
                  result.success
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-rose-50 text-rose-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                  <span className="font-medium">{result.message}</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                {/* Tool selection */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Select Tools
                  </label>
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
                    {availableTools.map((tool) => (
                      <label
                        key={tool.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedToolIds.includes(tool.id)}
                          onChange={() => toggleTool(tool.id)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-900">
                          {tool.name}
                        </span>
                        <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                          Available
                        </span>
                      </label>
                    ))}
                    {unavailableTools.map((tool) => (
                      <div
                        key={tool.id}
                        className="flex items-center gap-3 rounded-lg p-2 opacity-50"
                      >
                        <input
                          type="checkbox"
                          disabled
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-500">
                          {tool.name}
                        </span>
                        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          Unavailable
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date selection */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="pickupDate"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Pickup Date
                    </label>
                    <input
                      type="date"
                      id="pickupDate"
                      required
                      min={today}
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="returnDate"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Return Date
                    </label>
                    <input
                      type="date"
                      id="returnDate"
                      required
                      min={pickupDate || today}
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    disabled={isSubmitting}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || selectedToolIds.length === 0}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Reserving...
                      </span>
                    ) : (
                      `Reserve ${selectedToolIds.length} Tool(s)`
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
