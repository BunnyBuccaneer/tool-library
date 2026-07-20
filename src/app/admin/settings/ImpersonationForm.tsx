"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Member {
  id: string;
  name: string | null;
  email: string;
}

interface ImpersonationFormProps {
  action: "start" | "stop";
  members?: Member[];
}

export default function ImpersonationForm({ action, members }: ImpersonationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [error, setError] = useState("");

  const handleStart = async () => {
    if (!selectedUserId) {
      setError("Please select a customer");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/impersonation/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to start impersonation");
        return;
      }

      router.refresh();
    } catch {
      setError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/impersonation/stop", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to stop impersonation");
        return;
      }

      router.refresh();
    } catch {
      setError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (action === "stop") {
    return (
      <button
        onClick={handleStop}
        disabled={isLoading}
        className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
      >
        {isLoading ? "Stopping..." : "Stop Impersonating"}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <select
          value={selectedUserId}
          onChange={(e) => {
            setSelectedUserId(e.target.value);
            setError("");
          }}
          className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a customer to view as...</option>
          {members?.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name || member.email} ({member.email})
            </option>
          ))}
        </select>
        <button
          onClick={handleStart}
          disabled={isLoading || !selectedUserId}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Starting..." : "View as Customer"}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
