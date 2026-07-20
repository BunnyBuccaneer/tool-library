"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/dashboard/Toast";
import type { Notification } from "@/db/schema";

interface Props {
  notifications: Notification[];
}

export default function NotificationsClient({ notifications }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const markAllRead = async () => {
    setLoading(true);
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      toast("All marked as read", "success");
      router.refresh();
    } catch {
      toast("Failed to mark as read", "error");
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      router.refresh();
    } catch {
      toast("Failed to mark as read", "error");
    }
  };

  const deleteNotif = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      router.refresh();
    } catch {
      toast("Failed to delete", "error");
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const typeIcons: Record<string, string> = {
    reservation_reminder: "📋",
    pickup_reminder: "📦",
    return_reminder: "🔄",
    overdue: "⚠️",
    membership_expiring: "🎫",
    general: "ℹ️",
  };

  return (
    <>
      {unreadCount > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </p>
          <button
            onClick={markAllRead}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Mark All Read
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No notifications.
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border p-4 ${
                n.isRead
                  ? "border-slate-200 bg-white"
                  : "border-blue-200 bg-blue-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-lg shrink-0">
                    {typeIcons[n.type] ?? "ℹ️"}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 text-sm">
                      {n.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {n.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {!n.isRead && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="rounded p-1 text-xs text-blue-600 hover:bg-blue-100"
                      title="Mark read"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotif(n.id)}
                    className="rounded p-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-red-500"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
