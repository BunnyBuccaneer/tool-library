"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPartner, updatePartner } from "@/lib/actions/partners";
import { Plus, Pencil, X } from "lucide-react";

interface PartnerFormProps {
  mode: "create" | "edit";
  partner?: {
    id: string;
    name: string;
    type: string;
    description: string | null;
    website: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
  };
}

export function PartnerForm({ mode, partner }: PartnerFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(partner?.name ?? "");
  const [type, setType] = useState(partner?.type ?? "vendor");
  const [description, setDescription] = useState(partner?.description ?? "");
  const [website, setWebsite] = useState(partner?.website ?? "");
  const [email, setEmail] = useState(partner?.email ?? "");
  const [phone, setPhone] = useState(partner?.phone ?? "");
  const [address, setAddress] = useState(partner?.address ?? "");
  const [city, setCity] = useState(partner?.city ?? "");
  const [state, setState] = useState(partner?.state ?? "");
  const [zipCode, setZipCode] = useState(partner?.zipCode ?? "");

  const resetForm = () => {
    if (mode === "create") {
      setName(""); setType("vendor"); setDescription(""); setWebsite(""); setEmail("");
      setPhone(""); setAddress(""); setCity(""); setState(""); setZipCode("");
    }
    setError(null);
  };

  const handleSubmit = () => {
    if (!name.trim()) { setError("Name is required."); return; }
    setError(null);
    startTransition(async () => {
      const payload = {
        name: name.trim(),
        type: type as any,
        description: description.trim() || undefined,
        website: website.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zipCode: zipCode.trim() || undefined,
      };
      let result;
      if (mode === "create") {
        result = await createPartner(payload);
        if (result.success && result.id) { setOpen(false); resetForm(); router.push(`/admin/partners/${result.id}`); return; }
      } else if (partner) {
        result = await updatePartner(partner.id, payload);
      } else { return; }
      if (result?.success) { setOpen(false); resetForm(); }
      else setError(result?.error ?? "An error occurred.");
    });
  };

  if (!open) {
    return mode === "create" ? (
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"><Plus className="h-4 w-4" /> New Partner</button>
    ) : (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"><Pencil className="h-3.5 w-3.5" /> Edit</button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setOpen(false); resetForm(); }} />
      <div className="relative z-10 mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button onClick={() => { setOpen(false); resetForm(); }} className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="h-4 w-4" /></button>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">{mode === "create" ? "New Partner" : "Edit Partner"}</h3>
        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="supplier">Supplier</option><option value="vendor">Vendor</option><option value="sponsor">Sponsor</option><option value="manufacturer">Manufacturer</option><option value="service_provider">Service Provider</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="mb-1 block text-sm font-medium text-slate-700">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700">Phone</label><input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
          </div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Website</label><input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
          <div><label className="mb-1 block text-sm font-medium text-slate-700">Address</label><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="mb-1 block text-sm font-medium text-slate-700">City</label><input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700">State</label><input type="text" value={state} onChange={(e) => setState(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700">Zip</label><input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /></div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => { setOpen(false); resetForm(); }} disabled={isPending} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
          <button onClick={handleSubmit} disabled={isPending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{isPending ? "Saving…" : mode === "create" ? "Create" : "Save Changes"}</button>
        </div>
      </div>
    </div>
  );
}