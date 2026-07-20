"use client";

import { useState, useTransition } from "react";
import type { RepairPartRecord } from "@/lib/data/repairs";
import { addRepairPart, updatePartStatus, removeRepairPart } from "@/lib/actions/repairs";
import { Plus, X, Trash2, Package, CheckCircle } from "lucide-react";

interface RepairPartsProps {
  repairId: string;
  parts: RepairPartRecord[];
  isEditable: boolean;
}

export function RepairPartsManager({ repairId, parts, isEditable }: RepairPartsProps) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [vendor, setVendor] = useState("");

  const totalPartsCost = parts.reduce((sum, p) => {
    if (p.unitCost) return sum + parseFloat(p.unitCost) * p.quantity;
    return sum;
  }, 0);

  const handleAdd = () => {
    if (!name.trim()) { setError("Part name is required."); return; }
    setError(null);

    startTransition(async () => {
      const result = await addRepairPart({
        repairId,
        name: name.trim(),
        partNumber: partNumber || undefined,
        quantity: parseInt(quantity, 10) || 1,
        unitCost: unitCost || undefined,
        vendor: vendor || undefined,
      });
      if (result.success) {
        setShowForm(false);
        setName(""); setPartNumber(""); setQuantity("1"); setUnitCost(""); setVendor("");
      } else {
        setError(result.error ?? "Failed.");
      }
    });
  };

  const toggleOrdered = (partId: string, current: boolean) => {
    startTransition(async () => {
      await updatePartStatus(partId, repairId, { isOrdered: !current });
    });
  };

  const toggleReceived = (partId: string, current: boolean) => {
    startTransition(async () => {
      await updatePartStatus(partId, repairId, { isReceived: !current });
    });
  };

  const removePart = (partId: string) => {
    startTransition(async () => {
      await removeRepairPart(partId, repairId);
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Parts & Materials</h3>
          {parts.length > 0 && (
            <p className="text-xs text-slate-500">
              {parts.length} part{parts.length !== 1 ? "s" : ""} — Total: ${totalPartsCost.toFixed(2)}
            </p>
          )}
        </div>
        {isEditable && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-4 w-4" /> Add Part
          </button>
        )}
      </div>

      {/* Parts list */}
      {parts.length > 0 ? (
        <div className="space-y-2">
          {parts.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
              <div>
                <p className="font-medium text-slate-900">{p.name}</p>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  {p.partNumber && <span>#{p.partNumber}</span>}
                  <span>Qty: {p.quantity}</span>
                  {p.unitCost && <span>${parseFloat(p.unitCost).toFixed(2)} ea</span>}
                  {p.vendor && <span>Vendor: {p.vendor}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isEditable && (
                  <>
                    <button
                      onClick={() => toggleOrdered(p.id, p.isOrdered)}
                      disabled={isPending}
                      className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition ${
                        p.isOrdered ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500 hover:bg-blue-50"
                      }`}
                      title={p.isOrdered ? "Ordered" : "Mark as ordered"}
                    >
                      <Package className="h-3 w-3" />
                      {p.isOrdered ? "Ordered" : "Order"}
                    </button>
                    <button
                      onClick={() => toggleReceived(p.id, p.isReceived)}
                      disabled={isPending}
                      className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition ${
                        p.isReceived ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500 hover:bg-green-50"
                      }`}
                      title={p.isReceived ? "Received" : "Mark as received"}
                    >
                      <CheckCircle className="h-3 w-3" />
                      {p.isReceived ? "Received" : "Receive"}
                    </button>
                    <button
                      onClick={() => removePart(p.id)}
                      disabled={isPending}
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
                {!isEditable && (
                  <div className="flex gap-1.5">
                    {p.isOrdered && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">Ordered</span>}
                    {p.isReceived && <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">Received</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No parts added yet.</p>
      )}

      {/* Add form */}
      {showForm && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
          {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-600">{error}</div>}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Part name" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Part #</label>
                <input type="text" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Qty</label>
                <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Unit Cost ($)</label>
                <input type="number" step="0.01" min="0" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Vendor</label>
                <input type="text" value={vendor} onChange={(e) => setVendor(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} disabled={isPending} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
              <button onClick={handleAdd} disabled={isPending} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{isPending ? "Adding…" : "Add Part"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}