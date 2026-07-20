"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { updateRepairStatus, addRepairNote } from "@/lib/actions/repairs";
import { Search, Wrench, Package, CheckCircle, XCircle, StickyNote } from "lucide-react";

interface RepairActionsProps {
  repairId: string;
  currentStatus: string;
}

const statusFlow: Record<string, { next: string[]; labels: Record<string, { icon: React.ReactNode; label: string; variant: "default" | "danger" | "warning" }> }> = {
  reported: {
    next: ["diagnosing"],
    labels: {
      diagnosing: { icon: <Search className="h-4 w-4" />, label: "Start Diagnosis", variant: "default" },
    },
  },
  diagnosing: {
    next: ["in_repair", "unrepairable"],
    labels: {
      in_repair: { icon: <Wrench className="h-4 w-4" />, label: "Begin Repair", variant: "default" },
      unrepairable: { icon: <XCircle className="h-4 w-4" />, label: "Mark Unrepairable", variant: "danger" },
    },
  },
  in_repair: {
    next: ["waiting_parts", "completed", "unrepairable"],
    labels: {
      waiting_parts: { icon: <Package className="h-4 w-4" />, label: "Waiting for Parts", variant: "warning" },
      completed: { icon: <CheckCircle className="h-4 w-4" />, label: "Mark Completed", variant: "default" },
      unrepairable: { icon: <XCircle className="h-4 w-4" />, label: "Mark Unrepairable", variant: "danger" },
    },
  },
  waiting_parts: {
    next: ["in_repair"],
    labels: {
      in_repair: { icon: <Wrench className="h-4 w-4" />, label: "Resume Repair", variant: "default" },
    },
  },
};

export function RepairActions({ repairId, currentStatus }: RepairActionsProps) {
  const [targetStatus, setTargetStatus] = useState<string | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const flow = statusFlow[currentStatus];
  const isTerminal = currentStatus === "completed" || currentStatus === "unrepairable";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">Actions</h3>

      {actionError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{actionError}</div>
      )}

      <div className="space-y-2">
        {flow &&
          flow.next.map((nextStatus) => {
            const cfg = flow.labels[nextStatus];
            if (!cfg) return null;

            const btnClass =
              cfg.variant === "danger"
                ? "flex w-full items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                : cfg.variant === "warning"
                  ? "flex w-full items-center gap-2 rounded-lg border border-yellow-200 bg-white px-4 py-2.5 text-sm font-medium text-yellow-700 transition hover:bg-yellow-50"
                  : "flex w-full items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700";

            return (
              <button
                key={nextStatus}
                onClick={() => setTargetStatus(nextStatus)}
                className={btnClass}
              >
                {cfg.icon}
                {cfg.label}
              </button>
            );
          })}

        {isTerminal && (
          <p className="text-sm text-slate-500 italic">
            This repair is {currentStatus === "completed" ? "completed" : "marked unrepairable"}. No further actions available.
          </p>
        )}

        <button
          onClick={() => setShowNote(true)}
          className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <StickyNote className="h-4 w-4 text-yellow-500" />
          Add Note
        </button>
      </div>

      {/* Status change dialog */}
      {targetStatus && (
        <ConfirmDialog
          open={!!targetStatus}
          onClose={() => setTargetStatus(null)}
          onConfirm={async () => {
            setActionError(null);
            const result = await updateRepairStatus(repairId, targetStatus as any);
            if (!result.success) setActionError(result.error ?? "Failed.");
          }}
          title={`Change Status to "${targetStatus.replace(/_/g, " ")}"`}
          description={
            targetStatus === "completed"
              ? "Mark this repair as completed? The tool will be set back to available."
              : targetStatus === "unrepairable"
                ? "Mark as unrepairable? The tool will be retired."
                : `Move this repair to "${targetStatus.replace(/_/g, " ")}" status?`
          }
          confirmLabel="Confirm"
          variant={targetStatus === "unrepairable" ? "danger" : "default"}
        />
      )}

      {/* Note dialog */}
      <ConfirmDialog
        open={showNote}
        onClose={() => setShowNote(false)}
        onConfirm={async () => {
          if (!note.trim()) return;
          setActionError(null);
          const result = await addRepairNote(repairId, note.trim());
          if (result.success) {
            setNote("");
          } else {
            setActionError(result.error ?? "Failed.");
          }
        }}
        title="Add Note"
        description="Add a note to this repair's timeline."
        confirmLabel="Add Note"
        variant="default"
      >
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Describe progress, findings, etc."
        />
      </ConfirmDialog>
    </div>
  );
}