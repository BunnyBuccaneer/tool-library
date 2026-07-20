"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { updateAssignmentStatus } from "@/lib/actions/maintenance";
import { Play, CheckCircle, SkipForward } from "lucide-react";

interface AssignmentActionsProps {
  assignmentId: string;
  currentStatus: string;
}

export function AssignmentActions({
  assignmentId,
  currentStatus,
}: AssignmentActionsProps) {
  const [showStart, setShowStart] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [showSkip, setShowSkip] = useState(false);

  return (
    <div className="flex items-center gap-1">
      {currentStatus === "pending" && (
        <button
          onClick={() => setShowStart(true)}
          className="rounded p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
          title="Start"
        >
          <Play className="h-4 w-4" />
        </button>
      )}

      {(currentStatus === "pending" || currentStatus === "in_progress") && (
        <button
          onClick={() => setShowComplete(true)}
          className="rounded p-1.5 text-slate-400 hover:bg-green-50 hover:text-green-600"
          title="Complete"
        >
          <CheckCircle className="h-4 w-4" />
        </button>
      )}

      {currentStatus === "pending" && (
        <button
          onClick={() => setShowSkip(true)}
          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          title="Skip"
        >
          <SkipForward className="h-4 w-4" />
        </button>
      )}

      <ConfirmDialog
        open={showStart}
        onClose={() => setShowStart(false)}
        onConfirm={async () => {
          await updateAssignmentStatus(assignmentId, "in_progress");
        }}
        title="Start Assignment"
        description="Mark this assignment as in progress?"
        confirmLabel="Start"
        variant="default"
      />

      <ConfirmDialog
        open={showComplete}
        onClose={() => setShowComplete(false)}
        onConfirm={async () => {
          await updateAssignmentStatus(assignmentId, "completed");
        }}
        title="Complete Assignment"
        description="Mark this assignment as completed?"
        confirmLabel="Complete"
        variant="default"
      />

      <ConfirmDialog
        open={showSkip}
        onClose={() => setShowSkip(false)}
        onConfirm={async () => {
          await updateAssignmentStatus(assignmentId, "skipped");
        }}
        title="Skip Assignment"
        description="Skip this assignment? It will be marked as skipped."
        confirmLabel="Skip"
        variant="warning"
      />
    </div>
  );
}