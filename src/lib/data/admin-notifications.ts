import { db } from "@/db";
import {
  notifications,
  notificationTemplates,
  notificationBatches,
  users,
  memberProfiles,
} from "@/db/schema";
import {
  eq,
  ilike,
  and,
  or,
  desc,
  asc,
  count,
  sql,
  type SQL,
} from "drizzle-orm";

// ─── Notification list types ──────────────────────────────────────────────────

export interface NotificationListRecord {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationFilters {
  q?: string;
  type?: string;
  isRead?: string;
  page?: number;
  pageSize?: number;
}

export interface NotificationListResult {
  notifications: NotificationListRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Template types ───────────────────────────────────────────────────────────

export interface TemplateListRecord {
  id: string;
  name: string;
  slug: string;
  type: string;
  subject: string;
  body: string;
  variables: unknown;
  status: string;
  batchCount: number;
  createdAt: Date;
}

export interface TemplateFilters {
  q?: string;
  status?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}

export interface TemplateListResult {
  templates: TemplateListRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Batch types ──────────────────────────────────────────────────────────────

export interface BatchListRecord {
  id: string;
  templateId: string | null;
  templateName: string | null;
  sentById: string;
  sentByName: string | null;
  type: string;
  subject: string;
  body: string;
  segment: string | null;
  recipientCount: number;
  status: string;
  sentAt: Date | null;
  createdAt: Date;
}

export interface BatchFilters {
  q?: string;
  status?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}

export interface BatchListResult {
  batches: BatchListRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface NotificationStats {
  totalNotifications: number;
  unreadNotifications: number;
  totalTemplates: number;
  activeTemplates: number;
  totalBatches: number;
  sentBatches: number;
  totalRecipients: number;
}

// ─── Get all notifications ────────────────────────────────────────────────────

export async function getAllNotifications(
  filters: NotificationFilters = {}
): Promise<NotificationListResult> {
  const { q, type, isRead, page = 1, pageSize = 25 } = filters;

  const conditions: SQL[] = [];

  if (q) {
    conditions.push(
      or(
        ilike(notifications.title, `%${q}%`),
        ilike(notifications.message, `%${q}%`),
        ilike(users.name, `%${q}%`),
        ilike(users.email, `%${q}%`)
      )!
    );
  }

  if (type) {
    conditions.push(eq(notifications.type, type as any));
  }

  if (isRead === "true") {
    conditions.push(eq(notifications.isRead, true));
  } else if (isRead === "false") {
    conditions.push(eq(notifications.isRead, false));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ value: count() })
    .from(notifications)
    .innerJoin(users, eq(notifications.userId, users.id))
    .where(whereClause);

  const total = countResult?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const offset = (page - 1) * pageSize;

  const rows = await db
    .select({
      id: notifications.id,
      userId: notifications.userId,
      userName: users.name,
      userEmail: users.email,
      type: notifications.type,
      title: notifications.title,
      message: notifications.message,
      isRead: notifications.isRead,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .innerJoin(users, eq(notifications.userId, users.id))
    .where(whereClause)
    .orderBy(desc(notifications.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    notifications: rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.userName,
      userEmail: r.userEmail,
      type: r.type,
      title: r.title,
      message: r.message,
      isRead: r.isRead,
      readAt: r.readAt,
      createdAt: r.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}

// ─── Get all templates ────────────────────────────────────────────────────────

export async function getAllTemplates(
  filters: TemplateFilters = {}
): Promise<TemplateListResult> {
  const { q, status, type, page = 1, pageSize = 25 } = filters;

  const conditions: SQL[] = [];

  if (q) {
    conditions.push(
      or(
        ilike(notificationTemplates.name, `%${q}%`),
        ilike(notificationTemplates.subject, `%${q}%`)
      )!
    );
  }

  if (status) {
    conditions.push(eq(notificationTemplates.status, status as any));
  }

  if (type) {
    conditions.push(eq(notificationTemplates.type, type as any));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ value: count() })
    .from(notificationTemplates)
    .where(whereClause);

  const total = countResult?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const offset = (page - 1) * pageSize;

  const batchCountSq = db
    .select({
      templateId: notificationBatches.templateId,
      cnt: count().as("cnt"),
    })
    .from(notificationBatches)
    .groupBy(notificationBatches.templateId)
    .as("batch_count");

  const rows = await db
    .select({
      id: notificationTemplates.id,
      name: notificationTemplates.name,
      slug: notificationTemplates.slug,
      type: notificationTemplates.type,
      subject: notificationTemplates.subject,
      body: notificationTemplates.body,
      variables: notificationTemplates.variables,
      status: notificationTemplates.status,
      batchCount: batchCountSq.cnt,
      createdAt: notificationTemplates.createdAt,
    })
    .from(notificationTemplates)
    .leftJoin(batchCountSq, eq(notificationTemplates.id, batchCountSq.templateId))
    .where(whereClause)
    .orderBy(asc(notificationTemplates.name))
    .limit(pageSize)
    .offset(offset);

  return {
    templates: rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      type: r.type,
      subject: r.subject,
      body: r.body,
      variables: r.variables,
      status: r.status,
      batchCount: Number(r.batchCount ?? 0),
      createdAt: r.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}

// ─── Get all batches ──────────────────────────────────────────────────────────

export async function getAllBatches(
  filters: BatchFilters = {}
): Promise<BatchListResult> {
  const { q, status, type, page = 1, pageSize = 25 } = filters;

  const conditions: SQL[] = [];

  if (q) {
    conditions.push(
      or(
        ilike(notificationBatches.subject, `%${q}%`),
        ilike(users.name, `%${q}%`)
      )!
    );
  }

  if (status) {
    conditions.push(eq(notificationBatches.status, status as any));
  }

  if (type) {
    conditions.push(eq(notificationBatches.type, type as any));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ value: count() })
    .from(notificationBatches)
    .innerJoin(users, eq(notificationBatches.sentById, users.id))
    .where(whereClause);

  const total = countResult?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const offset = (page - 1) * pageSize;

  const rows = await db
    .select({
      id: notificationBatches.id,
      templateId: notificationBatches.templateId,
      templateName: notificationTemplates.name,
      sentById: notificationBatches.sentById,
      sentByName: users.name,
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
    .leftJoin(
      notificationTemplates,
      eq(notificationBatches.templateId, notificationTemplates.id)
    )
    .where(whereClause)
    .orderBy(desc(notificationBatches.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    batches: rows.map((r) => ({
      id: r.id,
      templateId: r.templateId,
      templateName: r.templateName ?? null,
      sentById: r.sentById,
      sentByName: r.sentByName,
      type: r.type,
      subject: r.subject,
      body: r.body,
      segment: r.segment,
      recipientCount: r.recipientCount,
      status: r.status,
      sentAt: r.sentAt,
      createdAt: r.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getNotificationStats(): Promise<NotificationStats> {
  const [notifStats] = await db
    .select({
      total: count(),
      unread: sql<number>`count(*) filter (where ${notifications.isRead} = false)`,
    })
    .from(notifications);

  const [templateStats] = await db
    .select({
      total: count(),
      active: sql<number>`count(*) filter (where ${notificationTemplates.status} = 'active')`,
    })
    .from(notificationTemplates);

  const [batchStats] = await db
    .select({
      total: count(),
      sent: sql<number>`count(*) filter (where ${notificationBatches.status} = 'sent')`,
      recipients: sql<number>`coalesce(sum(${notificationBatches.recipientCount}), 0)`,
    })
    .from(notificationBatches);

  return {
    totalNotifications: Number(notifStats?.total ?? 0),
    unreadNotifications: Number(notifStats?.unread ?? 0),
    totalTemplates: Number(templateStats?.total ?? 0),
    activeTemplates: Number(templateStats?.active ?? 0),
    totalBatches: Number(batchStats?.total ?? 0),
    sentBatches: Number(batchStats?.sent ?? 0),
    totalRecipients: Number(batchStats?.recipients ?? 0),
  };
}

// ─── Segment helpers ──────────────────────────────────────────────────────────

export type Segment =
  | "all_members"
  | "active_members"
  | "expired_members"
  | "members_with_overdue";

export async function getSegmentUserIds(segment: Segment): Promise<string[]> {
  switch (segment) {
    case "all_members": {
      const rows = await db
        .select({ userId: memberProfiles.userId })
        .from(memberProfiles);
      return rows.map((r) => r.userId);
    }
    case "active_members": {
      const rows = await db
        .select({ userId: memberProfiles.userId })
        .from(memberProfiles)
        .where(eq(memberProfiles.membershipStatus, "active"));
      return rows.map((r) => r.userId);
    }
    case "expired_members": {
      const rows = await db
        .select({ userId: memberProfiles.userId })
        .from(memberProfiles)
        .where(eq(memberProfiles.membershipStatus, "expired"));
      return rows.map((r) => r.userId);
    }
    case "members_with_overdue": {
      const { reservations } = await import("@/db/schema");
      const rows = await db
        .select({ userId: reservations.userId })
        .from(reservations)
        .where(eq(reservations.status, "overdue"))
        .groupBy(reservations.userId);
      return rows.map((r) => r.userId);
    }
    default:
      return [];
  }
}

// ─── Active templates for compose dropdown ────────────────────────────────────

export async function getActiveTemplatesDropdown(): Promise<
  { id: string; name: string; type: string; subject: string; body: string }[]
> {
  const rows = await db
    .select({
      id: notificationTemplates.id,
      name: notificationTemplates.name,
      type: notificationTemplates.type,
      subject: notificationTemplates.subject,
      body: notificationTemplates.body,
    })
    .from(notificationTemplates)
    .where(eq(notificationTemplates.status, "active"))
    .orderBy(asc(notificationTemplates.name));

  return rows;
}