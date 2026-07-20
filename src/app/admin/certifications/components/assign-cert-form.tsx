"use client";

import { useState, useTransition, useEffect } from "react";
import { assignMemberCert } from "@/lib/actions/certifications";
import { Plus, X } from "lucide-react";

export function AssignCertForm() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState("");
  const [certTypeId, setCertTypeId] = useState("");
  const [status, setStatus] = useState<"valid" | "pending">("pending");
  const [issuedDate, setIssuedDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Dropdown data loaded via fetch
  const [memberOptions, setMemberOptions] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [certTypeOptions, setCertTypeOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    if (open && memberOptions.length === 0) {
      setLoadingOptions(true);
      Promise.all([
        fetch("/api/admin/dropdown/members").then((r) => r.json()),
        fetch("/api/admin/dropdown/cert-types").then((r) => r.json()),
      ])
        .then(([members, certTypes]) => {
          setMemberOptions(members ?? []);
          setCertTypeOptions(certTypes ?? []);
        })
        .catch(() => {})
        .finally(() => setLoadingOptions(false));
    }
  }, [open, memberOptions.length]);

  const resetForm = () => {
    setUserId("");
    setCertTypeId("");
    setStatus("pending");
    setIssuedDate("");
    setExpiryDate("");
    setCertificateNumber("");
    setNotes("");
    setError(null);
  };

  const handleSubmit = () => {
    if (!userId || !certTypeId) {
      setError("Member and certification type are required.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await assignMemberCert({
        userId,
        certificationTypeId: certTypeId,
        status,
        issuedDate: issuedDate || undefined,
        expiryDate: expiryDate || undefined,
        certificateNumber: certificateNumber || undefined,
        notes: notes || undefined,
      });

      if (result.success) {
        setOpen(false);
        resetForm();
      } else {
        setError(result.error ?? "Failed to assign certification.");
      }
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        <Plus className="h-4 w-4" />
        Assign Cert
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => {
          setOpen(false);
          resetForm();
        }}
      />
      <div className="relative z-10 mx-4 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button
          onClick={() => {
            setOpen(false);
            resetForm();
          }}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Assign Certification
        </h3>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {loadingOptions ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Loading options…
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Member *
              </label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select member…</option>
                {memberOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || m.email} ({m.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Certification Type *
              </label>
              <select
                value={certTypeId}
                onChange={(e) => setCertTypeId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select certification…</option>
                {certTypeOptions.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "valid" | "pending")
                }
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="valid">Valid</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Issued Date
                </label>
                <input
                  type="date"
                  value={issuedDate}
                  onChange={(e) => setIssuedDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Certificate Number
              </label>
              <input
                type="text"
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                placeholder="e.g. CERT-2025-001"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Optional notes…"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => {
              setOpen(false);
              resetForm();
            }}
            disabled={isPending}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || loadingOptions}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Assigning…" : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}