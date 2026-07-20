"use client";

import { useState, useTransition } from "react";
import { sendNotification } from "@/lib/actions/admin-notifications";
import type { Segment } from "@/lib/data/admin-notifications";
import { Send, CheckCircle } from "lucide-react";

interface ComposeFormProps {
  templateDropdown: { id: string; name: string; type: string; subject: string; body: string }[];
}

export function ComposeForm({ templateDropdown }: ComposeFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ count: number } | null>(null);

  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [type, setType] = useState("general");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [segment, setSegment] = useState<Segment>("all_members");

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId) {
      const tpl = templateDropdown.find((t) => t.id === templateId);
      if (tpl) {
        setType(tpl.type);
        setTitle(tpl.subject);
        setMessage(tpl.body);
      }
    }
  };

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      setError("Title and message are required.");
      return;
    }
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await sendNotification({
        type: type as any,
        title: title.trim(),
        message: message.trim(),
        segment,
        templateId: selectedTemplateId || undefined,
      });

      if (result.success) {
        setSuccess({ count: result.recipientCount ?? 0 });
        setTitle("");
        setMessage("");
        setSelectedTemplateId("");
      } else {
        setError(result.error ?? "Failed to send.");
      }
    });
  };

  return (
    <div className="max-w-2xl">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Compose Notification</h3>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            Sent to {success.count} recipient{success.count !== 1 ? "s" : ""} successfully!
          </div>
        )}

        <div className="space-y-4">
          {/* Template picker */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Use Template (optional)</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Start from scratch…</option>
              {templateDropdown.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
              ))}
            </select>
          </div>

          {/* Segment */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Audience Segment *</label>
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value as Segment)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all_members">All Members</option>
              <option value="active_members">Active Members</option>
              <option value="expired_members">Expired Members</option>
              <option value="members_with_overdue">Members with Overdue Tools</option>
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="general">General</option>
              <option value="reservation_reminder">Reservation Reminder</option>
              <option value="pickup_reminder">Pickup Reminder</option>
              <option value="return_reminder">Return Reminder</option>
              <option value="overdue">Overdue</option>
              <option value="membership_expiring">Membership Expiring</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Message */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Write your notification message…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Preview */}
          {(title || message) && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Preview</p>
              <p className="font-medium text-slate-900">{title || "(no title)"}</p>
              <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{message || "(no message)"}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSend}
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isPending ? "Sending…" : "Send Notification"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}