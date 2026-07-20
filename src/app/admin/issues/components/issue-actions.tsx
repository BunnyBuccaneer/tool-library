"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  updateIssueStatus,
  updateIssueDetails,
  linkIssueToRepair,
  unlinkIssueFromRepair,
} from "@/lib/actions/issues";
import {
  Filter,
  UserPlus,
  Wrench,
  CheckCircle,
  XCircle,
  Play,
  Link as LinkIcon,
  Unlink,
} from "lucide-react";

interface IssueActionsProps {
  issueId: string;
  currentStatus: string;
  currentAssignedToId: string | null;
  currentRepairId: string | null;
  staffOptions: { id: string; name: string; email: string }[];
  repairOptions: { id: string; title: string; toolName: string; status: string }[];
}

export function IssueActions({
  issueId,
  currentStatus,
  currentAssignedToId,
  currentRepairId,
  staffOptions,
  repairOptions,
}: IssueActionsProps) {
  const [targetStatus, setTargetStatus] = useState<string | null>(null);
  const [showAssign, setShowAssign] = useState(false);
  const [showLinkRepair, setShowLinkRepair] = useState(false);
  const [assigneeId, setAssigneeId] = useState(currentAssignedToId ?? "");
  const [selectedRepairId, setSelectedRepairId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const isTerminal = currentStatus === "resolved" || currentStatus === "closed";

  const statusTransitions: Record<string, { status: string; label: string; icon: React.ReactNode; variant: "default" | "danger" | "warning" }[]> = {
    new: [
      { status: "triaged", label: "Triage", icon: <Filter className="h-4 w-4" />, variant: "default" },
    ],
    triaged: [
      { status: "assigned", label: "Assign", icon: <UserPlus className="h-4 w-4" />, variant: "default" },
    ],
    assigned: [
      { status: "in_progress", label: "Start Work", icon: <Play className="h-4 w-4" />, variant: "default" },
    ],
    in_progress: [
      { status: "resolved", label: "Resolve", icon: <CheckCircle className="h-4 w-4" />, variant: "default" },
    ],
    resolved: [
      { status: "closed", label: "Close", icon: <XCircle className="h-4 w-4" />, variant: "default" },
      { status: "in_progress", label: "Reopen", icon: <Play className="h-4 w-4" />, variant: "warning" },
    ],
  };

  const transitions = statusTransitions[currentStatus] ?? [];

  const handleAssign = () => {
    if (!assigneeId) return;
    setActionError(null);
    startTransition(async () => {
      const result = await updateIssueDetails(issueId, { assignedToId: assigneeId });
      if (result.success) {
        setShowAssign(false);
        if (currentStatus === "triaged" || currentStatus === "new") {
          await updateIssueStatus(issueId, "assigned");
        }
      } else {
        setActionError(result.error ?? "Failed.");
      }
    });
  };

  const handleLinkRepair = () => {
    if (!selectedRepairId) return;
    setActionError(null);
    startTransition(async () => {
      const result = await linkIssueToRepair(issueId, selectedRepairId);
      if (result.success) setShowLinkRepair(false);
      else setActionError(result.error ?? "Failed.");
    });
  };

  const handleUnlinkRepair = () => {
    setActionError(null);
    startTransition(async () => {
      await unlinkIssueFromRepair(issueId);
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">Actions</h3>

      {actionError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{actionError}</div>}

      <div className="space-y-2">
        {transitions.map((t) => {
          const btnClass = t.variant === "danger"
            ? "flex w-full items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
            : t.variant === "warning"
              ? "flex w-full items-center gap-2 rounded-lg border border-yellow-200 bg-white px-4 py-2.5 text-sm font-medium text-yellow-700 transition hover:bg-yellow-50"
              : "flex w-full items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700";
          return (
            <button key={t.status} onClick={() => setTargetStatus(t.status)} className={btnClass}>
              {t.icon} {t.label}
            </button>
          );
        })}

        {!isTerminal && (
          <button onClick={() => setShowAssign(true)} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            <UserPlus className="h-4 w-4 text-blue-500" /> Assign / Reassign
          </button>
        )}

        {!currentRepairId && !isTerminal && (
          <button onClick={() => setShowLinkRepair(true)} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            <LinkIcon className="h-4 w-4 text-teal-500" /> Link to Repair
          </button>
        )}

        {currentRepairId && (
          <button onClick={handleUnlinkRepair} disabled={isPending} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            <Unlink className="h-4 w-4 text-slate-400" /> Unlink Repair
          </button>
        )}

        {isTerminal && <p className="text-sm text-slate-500 italic">This issue is {currentStatus}.</p>}
      </div>

      {/* Status change dialog */}
      {targetStatus && (
        <ConfirmDialog
          open={!!targetStatus}
          onClose={() => setTargetStatus(null)}
          onConfirm={async () => {
            setActionError(null);
            const result = await updateIssueStatus(issueId, targetStatus as any);
            if (!result.success) setActionError(result.error ?? "Failed.");
          }}
          title={`Change Status to "${targetStatus.replace(/_/g, " ")}"`}
          description={`Move this issue to "${targetStatus.replace(/_/g, " ")}" status?`}
          confirmLabel="Confirm"
          variant={targetStatus === "closed" ? "warning" : "default"}
        />
      )}

      {/* Assign dialog */}
      <ConfirmDialog
        open={showAssign}
        onClose={() => setShowAssign(false)}
        onConfirm={handleAssign}
        title="Assign Issue"
        description="Select a staff member to assign this issue to."
        confirmLabel="Assign"
        variant="default"
      >
        <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">Select staff…</option>
          {staffOptions.map((s) => <option key={s.id} value={s.id}>{s.name || s.email} ({s.email})</option>)}
        </select>
      </ConfirmDialog>

      {/* Link repair dialog */}
      <ConfirmDialog
        open={showLinkRepair}
        onClose={() => setShowLinkRepair(false)}
        onConfirm={handleLinkRepair}
        title="Link to Repair"
        description="Select an active repair ticket to link to this issue."
        confirmLabel="Link"
        variant="default"
      >
        <select value={selectedRepairId} onChange={(e) => setSelectedRepairId(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">Select repair…</option>
          {repairOptions.map((r) => <option key={r.id} value={r.id}>{r.title} — {r.toolName} ({r.status})</option>)}
        </select>
      </ConfirmDialog>
    </div>
  );
}