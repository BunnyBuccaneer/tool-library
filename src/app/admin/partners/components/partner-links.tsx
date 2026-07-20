"use client";

import { useState, useTransition } from "react";
import type { PartnerToolLinkRecord, PartnerRepairLinkRecord, PartnerContactRecord } from "@/lib/data/partners";
import { addPartnerContact, removePartnerContact, linkPartnerTool, unlinkPartnerTool, linkPartnerRepair, unlinkPartnerRepair } from "@/lib/actions/partners";
import { Plus, Trash2, X, Wrench, User, Star } from "lucide-react";

// ─── Contacts Manager ─────────────────────────────────────────────────────────

export function ContactsManager({ partnerId, contacts }: { partnerId: string; contacts: PartnerContactRecord[] }) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  const handleAdd = () => {
    if (!name.trim()) { setError("Name is required."); return; }
    setError(null);
    startTransition(async () => {
      const result = await addPartnerContact({ partnerId, name: name.trim(), title: title.trim() || undefined, email: email.trim() || undefined, phone: phone.trim() || undefined, isPrimary });
      if (result.success) { setShowForm(false); setName(""); setTitle(""); setEmail(""); setPhone(""); setIsPrimary(false); }
      else setError(result.error ?? "Failed.");
    });
  };

  const handleRemove = (contactId: string) => {
    startTransition(async () => { await removePartnerContact(contactId, partnerId); });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Contacts ({contacts.length})</h3>
        {!showForm && <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"><Plus className="h-4 w-4" /> Add</button>}
      </div>
      {contacts.length > 0 ? (
        <div className="space-y-2">
          {contacts.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">{c.name.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-slate-900">{c.name}</p>
                    {c.isPrimary && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                  </div>
                  {c.title && <p className="text-xs text-slate-500">{c.title}</p>}
                  <div className="flex gap-3 text-xs text-slate-400">
                    {c.email && <span>{c.email}</span>}
                    {c.phone && <span>{c.phone}</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => handleRemove(c.id)} disabled={isPending} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-slate-500">No contacts added yet.</p>}
      {showForm && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
          {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-600">{error}</div>}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block text-xs font-medium text-slate-600">Name *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
              <div><label className="mb-1 block text-xs font-medium text-slate-600">Title</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block text-xs font-medium text-slate-600">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
              <div><label className="mb-1 block text-xs font-medium text-slate-600">Phone</label><input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600" /> Primary contact</label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} disabled={isPending} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
              <button onClick={handleAdd} disabled={isPending} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{isPending ? "Adding…" : "Add Contact"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tool Links Manager ───────────────────────────────────────────────────────

export function ToolLinksManager({ partnerId, toolLinks, toolOptions }: { partnerId: string; toolLinks: PartnerToolLinkRecord[]; toolOptions: { id: string; name: string; assetId: string | null }[] }) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toolId, setToolId] = useState("");
  const [relationship, setRelationship] = useState("");

  const handleAdd = () => {
    if (!toolId) { setError("Select a tool."); return; }
    setError(null);
    startTransition(async () => {
      const result = await linkPartnerTool({ partnerId, toolId, relationship: relationship.trim() || undefined });
      if (result.success) { setShowForm(false); setToolId(""); setRelationship(""); }
      else setError(result.error ?? "Failed.");
    });
  };

  const handleRemove = (linkId: string) => {
    startTransition(async () => { await unlinkPartnerTool(linkId, partnerId); });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Linked Tools ({toolLinks.length})</h3>
        {!showForm && <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"><Plus className="h-4 w-4" /> Link Tool</button>}
      </div>
      {toolLinks.length > 0 ? (
        <div className="space-y-2">
          {toolLinks.map((tl) => (
            <div key={tl.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900">{tl.toolName}</p>
                  <div className="flex gap-2 text-xs text-slate-400">
                    {tl.toolAssetId && <span>{tl.toolAssetId}</span>}
                    {tl.relationship && <span>— {tl.relationship}</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => handleRemove(tl.id)} disabled={isPending} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-slate-500">No tools linked.</p>}
      {showForm && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
          {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-600">{error}</div>}
          <div className="space-y-3">
            <div><label className="mb-1 block text-xs font-medium text-slate-600">Tool *</label><select value={toolId} onChange={(e) => setToolId(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"><option value="">Select tool…</option>{toolOptions.map((t) => <option key={t.id} value={t.id}>{t.name}{t.assetId ? ` (${t.assetId})` : ""}</option>)}</select></div>
            <div><label className="mb-1 block text-xs font-medium text-slate-600">Relationship</label><input type="text" value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="e.g. Supplier, Warranty Provider" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} disabled={isPending} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
              <button onClick={handleAdd} disabled={isPending} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{isPending ? "Linking…" : "Link"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Repair Links Manager ─────────────────────────────────────────────────────

export function RepairLinksManager({ partnerId, repairLinks, repairOptions }: { partnerId: string; repairLinks: PartnerRepairLinkRecord[]; repairOptions: { id: string; title: string; status: string }[] }) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [repairId, setRepairId] = useState("");
  const [role, setRole] = useState("");
  const [cost, setCost] = useState("");

  const handleAdd = () => {
    if (!repairId) { setError("Select a repair."); return; }
    setError(null);
    startTransition(async () => {
      const result = await linkPartnerRepair({ partnerId, repairId, role: role.trim() || undefined, cost: cost || undefined });
      if (result.success) { setShowForm(false); setRepairId(""); setRole(""); setCost(""); }
      else setError(result.error ?? "Failed.");
    });
  };

  const handleRemove = (linkId: string) => {
    startTransition(async () => { await unlinkPartnerRepair(linkId, partnerId); });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Linked Repairs ({repairLinks.length})</h3>
        {!showForm && <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"><Plus className="h-4 w-4" /> Link Repair</button>}
      </div>
      {repairLinks.length > 0 ? (
        <div className="space-y-2">
          {repairLinks.map((rl) => (
            <div key={rl.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5">
              <div>
                <p className="font-medium text-slate-900">{rl.repairTitle}</p>
                <div className="flex gap-2 text-xs text-slate-400">
                  <span>{rl.repairStatus}</span>
                  {rl.role && <span>— {rl.role}</span>}
                  {rl.cost && <span>— ${parseFloat(rl.cost).toFixed(2)}</span>}
                </div>
              </div>
              <button onClick={() => handleRemove(rl.id)} disabled={isPending} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-slate-500">No repairs linked.</p>}
      {showForm && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
          {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-600">{error}</div>}
          <div className="space-y-3">
            <div><label className="mb-1 block text-xs font-medium text-slate-600">Repair *</label><select value={repairId} onChange={(e) => setRepairId(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"><option value="">Select repair…</option>{repairOptions.map((r) => <option key={r.id} value={r.id}>{r.title} ({r.status})</option>)}</select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block text-xs font-medium text-slate-600">Role</label><input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Parts supplier" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
              <div><label className="mb-1 block text-xs font-medium text-slate-600">Cost ($)</label><input type="number" step="0.01" min="0" value={cost} onChange={(e) => setCost(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} disabled={isPending} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
              <button onClick={handleAdd} disabled={isPending} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{isPending ? "Linking…" : "Link"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}