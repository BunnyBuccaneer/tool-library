"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { updatePartner, deletePartner } from "@/lib/actions/partners";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle, Trash2 } from "lucide-react";

interface PartnerActionsProps {
  partnerId: string;
  currentStatus: string;
}

export function PartnerActions({ partnerId, currentStatus }: PartnerActionsProps) {
  const router = useRouter();
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showActivate, setShowActivate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">Actions</h3>
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
      <div className="space-y-2">
        {currentStatus !== "inactive" ? (
          <button onClick={() => setShowDeactivate(true)} className="flex w-full items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50">
            <Ban className="h-4 w-4" /> Deactivate
          </button>
        ) : (
          <button onClick={() => setShowActivate(true)} className="flex w-full items-center gap-2 rounded-lg border border-green-200 bg-white px-4 py-2.5 text-sm font-medium text-green-600 transition hover:bg-green-50">
            <CheckCircle className="h-4 w-4" /> Activate
          </button>
        )}
        <button onClick={() => setShowDelete(true)} className="flex w-full items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50">
          <Trash2 className="h-4 w-4" /> Delete Partner
        </button>
      </div>

      <ConfirmDialog open={showDeactivate} onClose={() => setShowDeactivate(false)} onConfirm={async () => { const r = await updatePartner(partnerId, { status: "inactive" }); if (!r.success) setError(r.error ?? "Failed."); }} title="Deactivate Partner" description="Set this partner to inactive?" confirmLabel="Deactivate" variant="warning" />
      <ConfirmDialog open={showActivate} onClose={() => setShowActivate(false)} onConfirm={async () => { const r = await updatePartner(partnerId, { status: "active" }); if (!r.success) setError(r.error ?? "Failed."); }} title="Activate Partner" description="Set this partner to active?" confirmLabel="Activate" variant="default" />
      <ConfirmDialog open={showDelete} onClose={() => setShowDelete(false)} onConfirm={async () => { const r = await deletePartner(partnerId); if (r.success) router.push("/admin/partners"); else setError(r.error ?? "Failed."); }} title="Delete Partner" description="Permanently delete this partner and all associated contacts and links? This action cannot be undone." confirmLabel="Delete" variant="danger" />
    </div>
  );
}