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
} from "lucide-react";

interface MemberActionsProps {
  profileId: string;
  userId: string;
  currentStatus: string;
  currentRole: string;
  isActive: boolean;
  currentNotes: string;
}

export function MemberActions({
  profileId,
  userId,
  currentStatus,
  currentRole,
  isActive,
  currentNotes,
}: MemberActionsProps) {
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [showToggleAccountDialog, setShowToggleAccountDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);

  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [notes, setNotes] = useState(currentNotes);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleSuspend = async () => {
    setActionError(null);
    const result = await updateMembershipStatus(profileId, "suspended");
    if (!result.success) setActionError(result.error ?? "Failed");
  };

  const handleActivate = async () => {
    setActionError(null);
    const result = await updateMembershipStatus(profileId, "active");
    if (!result.success) setActionError(result.error ?? "Failed");
  };

  const handleToggleAccount = async () => {
    setActionError(null);
    const result = await toggleUserActive(userId, !isActive);
    if (!result.success) setActionError(result.error ?? "Failed");
  };

  const handleChangeRole = async () => {
    setActionError(null);
    const result = await changeUserRole(
      userId,
      selectedRole as "super_admin" | "admin" | "manager" | "employee" | "member"
    );
    if (!result.success) setActionError(result.error ?? "Failed");
  };

  const handleSaveNotes = async () => {
    setActionError(null);
    const result = await updateMemberNotes(profileId, notes);
    if (!result.success) setActionError(result.error ?? "Failed");
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">
        Admin Actions
      </h3>

      {actionError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          {actionError}
        </div>
      )}

      <div className="space-y-2">
        {/* Suspend / Activate membership */}
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

        {/* Toggle account active */}
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

        {/* Change role */}
        <button
          onClick={() => setShowRoleDialog(true)}
          className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <UserCog className="h-4 w-4 text-blue-500" />
          Change Role
        </button>

        {/* Edit notes */}
        <button
          onClick={() => setShowNotesDialog(true)}
          className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <StickyNote className="h-4 w-4 text-yellow-500" />
          Edit Notes
        </button>
      </div>

      {/* Suspend dialog */}
      <ConfirmDialog
        open={showSuspendDialog}
        onClose={() => setShowSuspendDialog(false)}
        onConfirm={handleSuspend}
        title="Suspend Membership"
        description="This will suspend the member's account. They will not be able to make new reservations or check out tools. Are you sure?"
        confirmLabel="Suspend"
        variant="danger"
      />

      {/* Activate dialog */}
      <ConfirmDialog
        open={showActivateDialog}
        onClose={() => setShowActivateDialog(false)}
        onConfirm={handleActivate}
        title="Reactivate Membership"
        description="This will restore the member to active status. They will be able to use the system normally again."
        confirmLabel="Reactivate"
        variant="default"
      />

      {/* Toggle account dialog */}
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

      {/* Role dialog */}
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

      {/* Notes dialog */}
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