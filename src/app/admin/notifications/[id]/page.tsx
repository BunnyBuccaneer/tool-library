import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdminAuth } from "@/lib/admin-auth";
import { db } from "@/db";
import { notificationBatches, notificationTemplates, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader, Breadcrumb } from "@/components/admin/page-header";
import { StatusBadge, type BadgeVariant } from "@/components/admin/status-badge";
import { format } from "date-fns";
import { Send, User, Calendar, Users, FileText } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const [batch] = await db
    .select({ subject: notificationBatches.subject })
    .from(notificationBatches)
    .where(eq(notificationBatches.id, id))
    .limit(1);
  return { title: batch ? `${batch.subject} | Delivery Log | Admin` : "Not Found" };
}

export default async function BatchDetailPage({ params }: PageProps) {
  await requireAdminAuth();

  const { id } = await params;

  const [batch] = await db
    .select({
      id: notificationBatches.id,
      templateId: notificationBatches.templateId,
      templateName: notificationTemplates.name,
      sentById: notificationBatches.sentById,
      sentByName: users.name,
      sentByEmail: users.email,
      type: notificationBatches.type,
      subject: notificationBatches.subject,
      body: notificationBatches.body,
      segment: notificationBatches.segment,
      recipientCount: notificationBatches.recipientCount,
      status: notificationBatches.status,
      sentAt: notificationBatches.sentAt,
      createdAt: notificationBatches.createdAt,
    })
    .from(notificationBatches)
    .innerJoin(users, eq(notificationBatches.sentById, users.id))
    .leftJoin(notificationTemplates, eq(notificationBatches.templateId, notificationTemplates.id))
    .where(eq(notificationBatches.id, id))
    .limit(1);

  if (!batch) notFound();

  function batchStatusBadge(status: string) {
    const map: Record<string, { variant: BadgeVariant; label: string }> = {
      draft: { variant: "slate", label: "Draft" },
      sending: { variant: "yellow", label: "Sending" },
      sent: { variant: "green", label: "Sent" },
      failed: { variant: "red", label: "Failed" },
    };
    const cfg = map[status] ?? { variant: "slate", label: status };
    return <StatusBadge variant={cfg.variant} label={cfg.label} />;
  }

  return (
    <div>
      <PageHeader
        title={batch.subject}
        description="Notification delivery details"
        breadcrumb={
          <Breadcrumb items={[
            { label: "Admin", href: "/admin" },
            { label: "Notifications", href: "/admin/notifications?tab=log" },
            { label: batch.subject },
          ]} />
        }
        actions={
          <Link href="/admin/notifications?tab=log" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">← Back</Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Details</h3>
            <div className="mb-3">{batchStatusBadge(batch.status)}</div>
            <div className="space-y-3 text-sm">
              <InfoRow icon={<Send className="h-4 w-4" />} label="Type" value={batch.type.replace(/_/g, " ")} />
              <InfoRow icon={<Users className="h-4 w-4" />} label="Recipients" value={String(batch.recipientCount)} />
              <InfoRow icon={<Users className="h-4 w-4" />} label="Segment" value={batch.segment?.replace(/_/g, " ") ?? "—"} />
              <InfoRow icon={<User className="h-4 w-4" />} label="Sent By" value={batch.sentByName ?? batch.sentByEmail} />
              {batch.templateName && <InfoRow icon={<FileText className="h-4 w-4" />} label="Template" value={batch.templateName} />}
              <InfoRow icon={<Calendar className="h-4 w-4" />} label="Created" value={format(new Date(batch.createdAt), "MMM d, yyyy h:mm a")} />
              {batch.sentAt && <InfoRow icon={<Calendar className="h-4 w-4" />} label="Sent At" value={format(new Date(batch.sentAt), "MMM d, yyyy h:mm a")} />}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Message Content</h3>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-lg font-semibold text-slate-900">{batch.subject}</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{batch.body}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex-shrink-0 text-slate-400">{icon}</span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-slate-700">{value}</p>
      </div>
    </div>
  );
}