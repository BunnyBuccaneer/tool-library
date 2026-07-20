import { db } from "@/db";
import {
  issues,
  issueComments,
  tools,
  users,
  repairs,
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
import { alias } from "drizzle-orm/pg-core";

const reporterUsers = alias(users, "reporter_users");
const assigneeUsers = alias(users, "assignee_users");
const commentAuthor = alias(users, "comment_author");

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IssueListRecord {
  id: string;
  toolId: string | null;
  toolName: string | null;
  toolAssetId: string | null;
  reportedById: string;
  reportedByName: string | null;
  assignedToId: string | null;
  assignedToName: string | null;
  repairId: string | null;
  status: string;
  priority: string;
  category: string;
  title: string;
  description: string | null;
  commentCount: number;
  createdAt: Date;
}

export interface IssueDetailRecord extends IssueListRecord {
  resolution: string | null;
  resolvedAt: Date | null;
  closedAt: Date | null;
  updatedAt: Date;
  repairTitle: string | null;
  repairStatus: string | null;
  comments: IssueCommentRecord[];
}

export interface IssueCommentRecord {
  id: string;
  issueId: string;
  authorId: string;
  authorName: string | null;
  content: string;
  isStatusChange: boolean;
  oldStatus: string | null;
  newStatus: string | null;
  createdAt: Date;
}

export interface IssueFilters {
  q?: string;
  status?: string;
  priority?: string;
  category?: string;
  assignedToId?: string;
  hasRepair?: boolean;
  page?: number;
  pageSize?: number;
}

export interface IssueListResult {
  issues: IssueListRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IssueStats {
  total: number;
  new: number;
  triaged: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  closed: number;
  critical: number;
  linkedToRepair: number;
}

// ─── Get all issues ───────────────────────────────────────────────────────────

export async function getAllIssues(
  filters: IssueFilters = {}
): Promise<IssueListResult> {
  const {
    q,
    status,
    priority,
    category,
    assignedToId,
    hasRepair,
    page = 1,
    pageSize = 25,
  } = filters;

  const conditions: SQL[] = [];

  if (q) {
    conditions.push(
      or(
        ilike(issues.title, `%${q}%`),
        ilike(issues.description, `%${q}%`),
        ilike(tools.name, `%${q}%`),
        ilike(tools.assetId, `%${q}%`)
      )!
    );
  }

  if (status) {
    conditions.push(eq(issues.status, status as any));
  }

  if (priority) {
    conditions.push(eq(issues.priority, priority as any));
  }

  if (category) {
    conditions.push(eq(issues.category, category as any));
  }

  if (assignedToId) {
    conditions.push(eq(issues.assignedToId, assignedToId));
  }

  if (hasRepair === true) {
    conditions.push(sql`${issues.repairId} IS NOT NULL`);
  } else if (hasRepair === false) {
    conditions.push(sql`${issues.repairId} IS NULL`);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ value: count() })
    .from(issues)
    .leftJoin(tools, eq(issues.toolId, tools.id))
    .where(whereClause);

  const total = countResult?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const offset = (page - 1) * pageSize;

  const commentCountSq = db
    .select({
      issueId: issueComments.issueId,
      cnt: count().as("cnt"),
    })
    .from(issueComments)
    .groupBy(issueComments.issueId)
    .as("comment_count");

  const rows = await db
    .select({
      id: issues.id,
      toolId: issues.toolId,
      toolName: tools.name,
      toolAssetId: tools.assetId,
      reportedById: issues.reportedById,
      reportedByName: reporterUsers.name,
      assignedToId: issues.assignedToId,
      assignedToName: assigneeUsers.name,
      repairId: issues.repairId,
      status: issues.status,
      priority: issues.priority,
      category: issues.category,
      title: issues.title,
      description: issues.description,
      commentCount: commentCountSq.cnt,
      createdAt: issues.createdAt,
    })
    .from(issues)
    .leftJoin(tools, eq(issues.toolId, tools.id))
    .innerJoin(reporterUsers, eq(issues.reportedById, reporterUsers.id))
    .leftJoin(assigneeUsers, eq(issues.assignedToId, assigneeUsers.id))
    .leftJoin(commentCountSq, eq(issues.id, commentCountSq.issueId))
    .where(whereClause)
    .orderBy(desc(issues.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    issues: rows.map((r) => ({
      id: r.id,
      toolId: r.toolId,
      toolName: r.toolName ?? null,
      toolAssetId: r.toolAssetId ?? null,
      reportedById: r.reportedById,
      reportedByName: r.reportedByName,
      assignedToId: r.assignedToId,
      assignedToName: r.assignedToName ?? null,
      repairId: r.repairId,
      status: r.status,
      priority: r.priority,
      category: r.category,
      title: r.title,
      description: r.description,
      commentCount: Number(r.commentCount ?? 0),
      createdAt: r.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}

// ─── Get issue by ID ──────────────────────────────────────────────────────────

export async function getIssueById(
  id: string
): Promise<IssueDetailRecord | null> {
  const [row] = await db
    .select({
      id: issues.id,
      toolId: issues.toolId,
      toolName: tools.name,
      toolAssetId: tools.assetId,
      reportedById: issues.reportedById,
      reportedByName: reporterUsers.name,
      assignedToId: issues.assignedToId,
      assignedToName: assigneeUsers.name,
      repairId: issues.repairId,
      repairTitle: repairs.title,
      repairStatus: repairs.status,
      status: issues.status,
      priority: issues.priority,
      category: issues.category,
      title: issues.title,
      description: issues.description,
      resolution: issues.resolution,
      resolvedAt: issues.resolvedAt,
      closedAt: issues.closedAt,
      createdAt: issues.createdAt,
      updatedAt: issues.updatedAt,
    })
    .from(issues)
    .leftJoin(tools, eq(issues.toolId, tools.id))
    .innerJoin(reporterUsers, eq(issues.reportedById, reporterUsers.id))
    .leftJoin(assigneeUsers, eq(issues.assignedToId, assigneeUsers.id))
    .leftJoin(repairs, eq(issues.repairId, repairs.id))
    .where(eq(issues.id, id))
    .limit(1);

  if (!row) return null;

  const comments = await db
    .select({
      id: issueComments.id,
      issueId: issueComments.issueId,
      authorId: issueComments.authorId,
      authorName: commentAuthor.name,
      content: issueComments.content,
      isStatusChange: issueComments.isStatusChange,
      oldStatus: issueComments.oldStatus,
      newStatus: issueComments.newStatus,
      createdAt: issueComments.createdAt,
    })
    .from(issueComments)
    .innerJoin(commentAuthor, eq(issueComments.authorId, commentAuthor.id))
    .where(eq(issueComments.issueId, id))
    .orderBy(desc(issueComments.createdAt));

  return {
    id: row.id,
    toolId: row.toolId,
    toolName: row.toolName ?? null,
    toolAssetId: row.toolAssetId ?? null,
    reportedById: row.reportedById,
    reportedByName: row.reportedByName,
    assignedToId: row.assignedToId,
    assignedToName: row.assignedToName ?? null,
    repairId: row.repairId,
    repairTitle: row.repairTitle ?? null,
    repairStatus: row.repairStatus ?? null,
    status: row.status,
    priority: row.priority,
    category: row.category,
    title: row.title,
    description: row.description,
    resolution: row.resolution,
    resolvedAt: row.resolvedAt,
    closedAt: row.closedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    commentCount: comments.length,
    comments: comments.map((c) => ({
      id: c.id,
      issueId: c.issueId,
      authorId: c.authorId,
      authorName: c.authorName,
      content: c.content,
      isStatusChange: c.isStatusChange,
      oldStatus: c.oldStatus,
      newStatus: c.newStatus,
      createdAt: c.createdAt,
    })),
  };
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getIssueStats(): Promise<IssueStats> {
  const statusRows = await db
    .select({ status: issues.status, cnt: count() })
    .from(issues)
    .groupBy(issues.status);

  const map: Record<string, number> = {};
  let total = 0;
  for (const r of statusRows) {
    map[r.status] = Number(r.cnt);
    total += Number(r.cnt);
  }

  const [criticalCount] = await db
    .select({ value: count() })
    .from(issues)
    .where(
      and(
        eq(issues.priority, "critical"),
        or(
          eq(issues.status, "new"),
          eq(issues.status, "triaged"),
          eq(issues.status, "assigned"),
          eq(issues.status, "in_progress")
        )
      )
    );

  const [repairLinked] = await db
    .select({ value: count() })
    .from(issues)
    .where(sql`${issues.repairId} IS NOT NULL`);

  return {
    total,
    new: map["new"] ?? 0,
    triaged: map["triaged"] ?? 0,
    assigned: map["assigned"] ?? 0,
    inProgress: map["in_progress"] ?? 0,
    resolved: map["resolved"] ?? 0,
    closed: map["closed"] ?? 0,
    critical: Number(criticalCount?.value ?? 0),
    linkedToRepair: Number(repairLinked?.value ?? 0),
  };
}

// ─── Dropdowns ────────────────────────────────────────────────────────────────

export async function getStaffForIssueDropdown(): Promise<
  { id: string; name: string; email: string }[]
> {
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(
      and(
        eq(users.isActive, true),
        or(
          eq(users.role, "super_admin"),
          eq(users.role, "admin"),
          eq(users.role, "manager"),
          eq(users.role, "employee")
        )
      )
    )
    .orderBy(asc(users.name));
  return rows.map((r) => ({ id: r.id, name: r.name ?? "", email: r.email }));
}

export async function getRepairsForLinking(): Promise<
  { id: string; title: string; toolName: string; status: string }[]
> {
  const rows = await db
    .select({
      id: repairs.id,
      title: repairs.title,
      toolName: tools.name,
      status: repairs.status,
    })
    .from(repairs)
    .innerJoin(tools, eq(repairs.toolId, tools.id))
    .where(
      or(
        eq(repairs.status, "reported"),
        eq(repairs.status, "diagnosing"),
        eq(repairs.status, "in_repair"),
        eq(repairs.status, "waiting_parts")
      )
    )
    .orderBy(desc(repairs.createdAt))
    .limit(50);

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    toolName: r.toolName,
    status: r.status,
  }));
}

export async function getToolsForIssueDropdown(): Promise<
  { id: string; name: string; assetId: string | null }[]
> {
  return db
    .select({ id: tools.id, name: tools.name, assetId: tools.assetId })
    .from(tools)
    .where(eq(tools.isActive, true))
    .orderBy(asc(tools.name));
}