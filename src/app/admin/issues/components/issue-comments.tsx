"use client";

import { useState, useTransition } from "react";
import type { IssueCommentRecord } from "@/lib/data/issues";
import { addIssueComment } from "@/lib/actions/issues";
import { format } from "date-fns";
import { Send } from "lucide-react";

interface IssueCommentsProps {
  issueId: string;
  comments: IssueCommentRecord[];
}

export function IssueComments({ issueId, comments }: IssueCommentsProps) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!content.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await addIssueComment(issueId, content.trim());
      if (result.success) {
        setContent("");
      } else {
        setError(result.error ?? "Failed.");
      }
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">Timeline</h3>

      {/* Add comment */}
      <div className="mb-6">
        {error && <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-600">{error}</div>}
        <div className="flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            placeholder="Add a comment…"
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleSubmit}
            disabled={isPending || !content.trim()}
            className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Timeline */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-3">
              <div className="mt-1 flex flex-col items-center">
                <div className={`h-3 w-3 rounded-full border-2 ${c.isStatusChange ? "border-blue-500 bg-blue-100" : "border-slate-300 bg-slate-100"}`} />
                <div className="h-full w-px bg-slate-200" />
              </div>
              <div className="pb-4 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">{c.authorName ?? "System"}</p>
                  <span className="text-xs text-slate-400">{format(new Date(c.createdAt), "MMM d, yyyy h:mm a")}</span>
                </div>
                <p className={`mt-0.5 text-sm ${c.isStatusChange ? "font-medium text-blue-700" : "text-slate-600"}`}>{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No timeline entries yet.</p>
      )}
    </div>
  );
}