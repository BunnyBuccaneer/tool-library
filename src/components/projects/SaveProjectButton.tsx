"use client";

import { useState } from "react";

interface SaveProjectButtonProps {
  projectId: string;
  initialSaved?: boolean;
  onToggle?: (saved: boolean) => void;
}

export default function SaveProjectButton({
  projectId,
  initialSaved = false,
  onToggle,
}: SaveProjectButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/saved-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      setSaved(data.saved);
      onToggle?.(data.saved);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        saved
          ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      } ${loading ? "opacity-50" : ""}`}
      title={saved ? "Unsave project" : "Save project"}
    >
      {saved ? "📌 Saved" : "📌 Save"}
    </button>
  );
}