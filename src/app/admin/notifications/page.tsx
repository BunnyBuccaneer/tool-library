import { requireAdminAuth } from "@/lib/admin-auth";
import {
  getAllNotifications,
  getAllTemplates,
  getAllBatches,
  getNotificationStats,
  getActiveTemplatesDropdown,
} from "@/lib/data/admin-notifications";
import { PageHeader } from "@/components/admin/page-header";
import { Bell, Mail, FileText, Send, Users, Eye } from "lucide-react";
import { NotificationsTable } from "./components/notifications-table";
import { ComposeForm } from "./components/compose-form";
import { TemplateManager } from "./components/template-manager";
import { DeliveryLog } from "./components/delivery-log";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    isRead?: string;
    status?: string;
    tab?: string;
    page?: string;
  }>;
}

export const metadata = { title: "Notifications | Admin", description: "Manage notifications" };

export default async function AdminNotificationsPage({ searchParams }: PageProps) {
  await requireAdminAuth();

  const params = await searchParams;
  const tab = params.tab ?? "all";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const stats = await getNotificationStats();

  const notifResult = tab === "all"
    ? await getAllNotifications({ q: params.q, type: params.type, isRead: params.isRead, page, pageSize: 25 })
    : null;

  const templateResult = tab === "templates"
    ? await getAllTemplates({ q: params.q, status: params.status, type: params.type, page, pageSize: 25 })
    : null;

  const batchResult = tab === "log"
    ? await getAllBatches({ q: params.q, status: params.status, type: params.type, page, pageSize: 25 })
    : null;

  const templateDropdown = tab === "compose"
    ? await getActiveTemplatesDropdown()
    : [];

  return (
    <div>
      <PageHeader title="Notifications" description="Compose, send, and track notifications" />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        <StatCard icon={<Bell className="h-4 w-4 text-blue-500" />} label="Total" value={stats.totalNotifications} />
        <StatCard icon={<Eye className="h-4 w-4 text-yellow-500" />} label="Unread" value={stats.unreadNotifications} color="yellow" />
        <StatCard icon={<FileText className="h-4 w-4 text-purple-500" />} label="Templates" value={stats.totalTemplates} />
        <StatCard icon={<FileText className="h-4 w-4 text-green-500" />} label="Active Tpl" value={stats.activeTemplates} color="green" />
        <StatCard icon={<Send className="h-4 w-4 text-blue-500" />} label="Batches" value={stats.totalBatches} />
        <StatCard icon={<Send className="h-4 w-4 text-green-500" />} label="Sent" value={stats.sentBatches} color="green" />
        <StatCard icon={<Users className="h-4 w-4 text-teal-500" />} label="Recipients" value={stats.totalRecipients} />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
        <TabLink label="All Notifications" value="all" current={tab} />
        <TabLink label="Compose" value="compose" current={tab} />
        <TabLink label="Templates" value="templates" current={tab} />
        <TabLink label="Delivery Log" value="log" current={tab} />
      </div>

      {tab === "all" && notifResult && (
        <NotificationsTable
          notifications={notifResult.notifications}
          total={notifResult.total}
          page={notifResult.page}
          totalPages={notifResult.totalPages}
        />
      )}

      {tab === "compose" && (
        <ComposeForm templateDropdown={templateDropdown} />
      )}

      {tab === "templates" && templateResult && (
        <TemplateManager
          templates={templateResult.templates}
          total={templateResult.total}
          page={templateResult.page}
          totalPages={templateResult.totalPages}
        />
      )}

      {tab === "log" && batchResult && (
        <DeliveryLog
          batches={batchResult.batches}
          total={batchResult.total}
          page={batchResult.page}
          totalPages={batchResult.totalPages}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color?: string }) {
  const vc = color === "yellow" ? "text-yellow-600" : color === "green" ? "text-green-600" : "text-slate-900";
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="flex items-center gap-1.5">{icon}<p className="text-xs font-medium text-slate-500">{label}</p></div>
      <p className={`mt-0.5 text-xl font-bold ${vc}`}>{value}</p>
    </div>
  );
}

function TabLink({ label, value, current }: { label: string; value: string; current: string }) {
  const isActive = current === value;
  return (
    <a href={`/admin/notifications?tab=${value}`} className={`rounded-md px-4 py-2 text-sm font-medium transition ${isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
      {label}
    </a>
  );
}