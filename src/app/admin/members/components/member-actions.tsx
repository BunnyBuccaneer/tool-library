"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  updateMembershipStatus,
  toggleUserActive,
  changeUserRole,
  updateMemberNotes,
} from "@/lib/actions/members";
import {
  ShieldAlert,
  ShieldCheck,
  UserCog,
  Ban,
  CheckCircle,
  StickyNote,
  Clock,
} from "lucide-react";

interface MemberActionsProps {
  profileId: string;
  userId: string;
  currentStatus: string;
  currentRole: string;
  isActive: boolean;
  currentNotes: string;
}

// Prepends a timestamped line to the existing notes string
function buildUpdatedNotes(currentNotes: string, reason: string, newStatus: string): string {
  const today = new Date().toISOString().split("T")[0];
  const entry = `[${today}] Status → ${newStatus.toUpperCase()}: ${reason.trim()}`;
  return currentNotes.trim() ? `${entry}\n${currentNotes.trim()}` : entry;
}

export function MemberActions({
  profileId,
  userId,
  currentStatus,
  currentRole,
  isActive,
  currentNotes,
}: MemberActionsProps) {
  const [showSuspendDialog, setShowSuspendDialog]           = useState(false);
  const [showActivateDialog, setShowActivateDialog]         = useState(false);
  const [showToggleAccountDialog, setShowToggleAccountDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog]                 = useState(false);
  const [showNotesDialog, setShowNotesDialog]               = useState(false);

  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [notes, setNotes]               = useState(currentNotes);

  // Reason fields for status-changing actions
  const [suspendReason, setSuspendReason]     = useState("");
  const [activateReason, setActivateReason]   = useState("");
  const [approveLoading, setApproveLoading]   = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // ─── helpers ─────────────────────────────────────────────────────────────

  function flash(msg: string) {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  }

  // ─── handlers ────────────────────────────────────────────────────────────

  // One-click approve (pending → active)
  const handleQuickApprove = async () => {
    setActionError(null);
    setApproveLoading(true);

    const autoReason = "Approved membership application";
    const updatedNotes = buildUpdatedNotes(currentNotes, autoReason, "active");

    const [statusRes, notesRes] = await Promise.all([
      updateMembershipStatus(profileId, "active"),
      updateMemberNotes(profileId, updatedNotes),
    ]);

    setApproveLoading(false);

    if (!statusRes.success) {
      setActionError(statusRes.error ?? "Failed to approve");
      return;
    }
    if (!notesRes.success) {
      setActionError(notesRes.error ?? "Approved but failed to save note");
      return;
    }

    flash("Member approved and note saved!");
  };

  const handleSuspend = async () => {
    setActionError(null);

    if (!suspendReason.trim()) {
      setActionError("Please provide a reason before suspending.");
      return;
    }

    const updatedNotes = buildUpdatedNotes(currentNotes, suspendReason, "suspended");

    const [statusRes, notesRes] = await Promise.all([
      updateMembershipStatus(profileId, "suspended"),
      updateMemberNotes(profileId, updatedNotes),
    ]);

    if (!statusRes.success || !notesRes.success) {
      setActionError(statusRes.error ?? notesRes.error ?? "Failed");
      return;
    }

    setSuspendReason("");
    flash("Membership suspended and note saved.");
  };

  const handleActivate = async () => {
    setActionError(null);

    if (!activateReason.trim()) {
      setActionError("Please provide a reason before reactivating.");
      return;
    }

    const updatedNotes = buildUpdatedNotes(currentNotes, activateReason, "active");

    const [statusRes, notesRes] = await Promise.all([
      updateMembershipStatus(profileId, "active"),
      updateMemberNotes(profileId, updatedNotes),
    ]);

    if (!statusRes.success || !notesRes.success) {
      setActionError(statusRes.error ?? notesRes.error ?? "Failed");
      return;
    }

    setActivateReason("");
    flash("Membership reactivated and note saved.");
  };

  const handleToggleAccount = async () => {
    setActionError(null);
    const result = await toggleUserActive(userId, !isActive);
    if (!result.success) {
      setActionError(result.error ?? "Failed");
      return;
    }
    flash(isActive ? "Account disabled." : "Account enabled.");
  };

  const handleChangeRole = async () => {
    setActionError(null);
    const result = await changeUserRole(
      userId,
      selectedRole as "super_admin" | "admin" | "manager" | "employee" | "member"
    );
    if (!result.success) {
      setActionError(result.error ?? "Failed");
      return;
    }
    flash("Role updated.");
  };

  const handleSaveNotes = async () => {
    setActionError(null);
    const result = await updateMemberNotes(profileId, notes);
    if (!result.success) {
      setActionError(result.error ?? "Failed");
      return;
    }
    flash("Notes saved.");
  };

  // ─── render ──────────────────────────────────────────────────────────────

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">Admin Actions</h3>

      {/* ── alerts ── */}
      {actionError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {actionSuccess}
        </div>
      )}

      {/* ── quick approve banner (pending only) ── */}
      {currentStatus === "pending" && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 flex-shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  Pending Application
                </p>
                <p className="text-xs text-emerald-700">
                  Approve this member with one click.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickApprove}
              disabled={approveLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              {approveLoading ? "Approving…" : "Approve Now"}
            </button>
          </div>
        </div>
      )}

      {/* ── action buttons ── */}
      <div className="space-y-2">
        {currentStatus !== "suspended" ? (
          <button
            onClick={() => setShowSuspendDialog(true)}
            className="flex w-full items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <Ban className="h-4 w-4" />
            Suspend Membership
          </button>
        ) : (
          <button
            onClick={() => setShowActivateDialog(true)}
            className="flex w-full items-center gap-2 rounded-lg border border-green-200 bg-white px-4 py-2.5 text-sm font-medium text-green-600 transition hover:bg-green-50"
          >
            <CheckCircle className="h-4 w-4" />
            Reactivate Membership
          </button>
        )}

        <button
          onClick={() => setShowToggleAccountDialog(true)}
          className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {isActive ? (
            <>
              <ShieldAlert className="h-4 w-4 text-orange-500" />
              Disable Account
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4 text-green-500" />
              Enable Account
            </>
          )}
        </button>

        <button
          onClick={() => setShowRoleDialog(true)}
          className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <UserCog className="h-4 w-4 text-blue-500" />
          Change Role
        </button>

        <button
          onClick={() => setShowNotesDialog(true)}
          className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <StickyNote className="h-4 w-4 text-yellow-500" />
          Edit Notes
        </button>
      </div>

      {/* ── suspend dialog (requires reason) ── */}
      <ConfirmDialog
        open={showSuspendDialog}
        onClose={() => { setShowSuspendDialog(false); setSuspendReason(""); }}
        onConfirm={handleSuspend}
        title="Suspend Membership"
        description="This will suspend the member's account. They will not be able to make new reservations or check out tools."
        confirmLabel="Suspend"
        variant="danger"
      >
        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder="e.g. Unpaid dues / Policy violation…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Saved automatically with today's date in Admin Notes.
          </p>
        </div>
      </ConfirmDialog>

      {/* ── activate dialog (requires reason) ── */}
      <ConfirmDialog
        open={showActivateDialog}
        onClose={() => { setShowActivateDialog(false); setActivateReason(""); }}
        onConfirm={handleActivate}
        title="Reactivate Membership"
        description="This will restore the member to active status."
        confirmLabel="Reactivate"
        variant="default"
      >
        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={activateReason}
            onChange={(e) => setActivateReason(e.target.value)}
            placeholder="e.g. Paid outstanding balance / Issue resolved…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Saved automatically with today's date in Admin Notes.
          </p>
        </div>
      </ConfirmDialog>

      {/* ── toggle account dialog ── */}
      <ConfirmDialog
        open={showToggleAccountDialog}
        onClose={() => setShowToggleAccountDialog(false)}
        onConfirm={handleToggleAccount}
        title={isActive ? "Disable Account" : "Enable Account"}
        description={
          isActive
            ? "Disabling the account will prevent the user from logging in. Existing reservations are not affected."
            : "Enabling the account will allow the user to log in again."
        }
        confirmLabel={isActive ? "Disable" : "Enable"}
        variant={isActive ? "warning" : "default"}
      />

      {/* ── role dialog ── */}
      <ConfirmDialog
        open={showRoleDialog}
        onClose={() => setShowRoleDialog(false)}
        onConfirm={handleChangeRole}
        title="Change User Role"
        description="Select a new role for this user. This affects their permissions across the system."
        confirmLabel="Change Role"
        variant="warning"
      >
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="member">Member</option>
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </ConfirmDialog>

      {/* ── notes dialog ── */}
      <ConfirmDialog
        open={showNotesDialog}
        onClose={() => setShowNotesDialog(false)}
        onConfirm={handleSaveNotes}
        title="Edit Admin Notes"
        description="These notes are only visible to administrators."
        confirmLabel="Save Notes"
        variant="default"
      >
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Add notes about this member…"
        />
      </ConfirmDialog>
    </div>
  );
}