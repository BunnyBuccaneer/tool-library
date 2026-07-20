"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  approveReservation,
  rejectReservation,
  cancelReservation,
  checkoutReservation,
  returnReservation,
  markOverdue,
  updateReservationNotes,
} from "@/lib/actions/reservations";
import {
  CheckCircle,
  XCircle,
  Ban,
  PackageCheck,
  RotateCcw,
  AlertTriangle,
  StickyNote,
} from "lucide-react";

interface ReservationActionsProps {
  reservationId: string;
  currentStatus: string;
  currentNotes: string | null;
}

export function ReservationActions({
  reservationId,
  currentStatus,
  currentNotes,
}: ReservationActionsProps) {
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [showOverdue, setShowOverdue] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const [notes, setNotes] = useState(currentNotes ?? "");
  const [actionError, setActionError] = useState<string | null>(null);

  const runAction = async (
    action: () => Promise<{ success: boolean; error?: string }>
  ) => {
    setActionError(null);
    const result = await action();
    if (!result.success) {
      setActionError(result.error ?? "Action failed.");
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">Actions</h3>

      {actionError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          {actionError}
        </div>
      )}

      <div className="space-y-2">
        {/* Approve */}
        {currentStatus === "pending" && (
          <button
            onClick={() => setShowApprove(true)}
            className="flex w-full items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <CheckCircle className="h-4 w-4" />
            Approve Reservation
          </button>
        )}

        {/* Reject */}
        {currentStatus === "pending" && (
          <button
            onClick={() => setShowReject(true)}
            className="flex w-full items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <XCircle className="h-4 w-4" />
            Reject Reservation
          </button>
        )}

        {/* Check out */}
        {currentStatus === "confirmed" && (
          <button
            onClick={() => setShowCheckout(true)}
            className="flex w-full items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
          >
            <PackageCheck className="h-4 w-4" />
            Check Out Tool
          </button>
        )}

        {/* Return */}
        {(currentStatus === "checked_out" || currentStatus === "overdue") && (
          <button
            onClick={() => setShowReturn(true)}
            className="flex w-full items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            <RotateCcw className="h-4 w-4" />
            Return Tool
          </button>
        )}

        {/* Mark overdue */}
        {currentStatus === "checked_out" && (
          <button
            onClick={() => setShowOverdue(true)}
            className="flex w-full items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <AlertTriangle className="h-4 w-4" />
            Mark Overdue
          </button>
        )}

        {/* Cancel */}
        {(currentStatus === "pending" || currentStatus === "confirmed") && (
          <button
            onClick={() => setShowCancel(true)}
            className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Ban className="h-4 w-4 text-slate-400" />
            Cancel Reservation
          </button>
        )}

        {/* Edit notes */}
        <button
          onClick={() => setShowNotes(true)}
          className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <StickyNote className="h-4 w-4 text-yellow-500" />
          Edit Notes
        </button>
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={showApprove}
        onClose={() => setShowApprove(false)}
        onConfirm={() => runAction(() => approveReservation(reservationId))}
        title="Approve Reservation"
        description="Confirm this reservation? The tool will be marked as reserved. A conflict check will be performed."
        confirmLabel="Approve"
        variant="default"
      />

      <ConfirmDialog
        open={showReject}
        onClose={() => setShowReject(false)}
        onConfirm={() => runAction(() => rejectReservation(reservationId))}
        title="Reject Reservation"
        description="Reject and cancel this reservation? The member will need to create a new reservation."
        confirmLabel="Reject"
        variant="danger"
      />

      <ConfirmDialog
        open={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={() => runAction(() => cancelReservation(reservationId))}
        title="Cancel Reservation"
        description="Cancel this reservation? If the tool was reserved, it will be made available again."
        confirmLabel="Cancel Reservation"
        variant="warning"
      />

      <ConfirmDialog
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        onConfirm={() => runAction(() => checkoutReservation(reservationId))}
        title="Check Out Tool"
        description="Record the tool as checked out? The actual pickup date/time will be recorded now."
        confirmLabel="Check Out"
        variant="default"
      />

      <ConfirmDialog
        open={showReturn}
        onClose={() => setShowReturn(false)}
        onConfirm={() => runAction(() => returnReservation(reservationId))}
        title="Return Tool"
        description="Record this tool as returned? The tool will be made available again."
        confirmLabel="Return"
        variant="default"
      />

      <ConfirmDialog
        open={showOverdue}
        onClose={() => setShowOverdue(false)}
        onConfirm={() => runAction(() => markOverdue(reservationId))}
        title="Mark as Overdue"
        description="Flag this reservation as overdue? This will update the status but the tool remains checked out."
        confirmLabel="Mark Overdue"
        variant="danger"
      />

      <ConfirmDialog
        open={showNotes}
        onClose={() => setShowNotes(false)}
        onConfirm={() =>
          runAction(() => updateReservationNotes(reservationId, notes))
        }
        title="Edit Notes"
        description="Update notes for this reservation."
        confirmLabel="Save Notes"
        variant="default"
      >
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Add reservation notes…"
        />
      </ConfirmDialog>
    </div>
  );
}