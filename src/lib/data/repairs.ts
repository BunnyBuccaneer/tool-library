import { db } from "@/db";
import {
  repairs,
  repairParts,
  repairNotes,
  tools,
  users,
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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RepairListRecord {
  id: string;
  toolId: string;
  toolName: string;
  toolAssetId: string | null;
  reportedById: string;
  reportedByName: string | null;
  assignedToId: string | null;
  assignedToName: string | null;
  vendorName: string | null;
  status: string;
  priority: string;
  title: string;
  description: string | null;
  estimatedCost: string | null;
  actualCost: string | null;
  estimatedCompletion: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  partCount: number;
  noteCount: number;
  createdAt: Date;
}

export interface RepairDetailRecord extends RepairListRecord {
  diagnosis: string | null;
  resolution: string | null;
  toolBrand: string | null;
  toolModel: string | null;
  toolStatus: string;
  inspectionRunId: string | null;
  updatedAt: Date;
  parts: RepairPartRecord[];
  notes: RepairNoteRecord[];
}

export interface RepairPartRecord {
  id: string;
  repairId: string;
  name: string;
  partNumber: string | null;
  quantity: number;
  unitCost: string | null;
  vendor: string | null;
  isOrdered: boolean;
  isReceived: boolean;
  notes: string | null;
  createdAt: Date;
}

export interface RepairNoteRecord {
  id: string;
  repairId: string;
  authorId: string;
  authorName: string | null;
  content: string;
  isStatusChange: boolean;
  oldStatus: string | null;
  newStatus: string | null;
  createdAt: Date;
}

export interface RepairFilters {
  q?: string;
  status?: string;
  priority?: string;
  assignedToId?: string;
  page?: number;
  pageSize?: number;
}

export interface RepairListResult {
  repairs: RepairListRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RepairStats {
  total: number;
  reported: number;
  diagnosing: number;
  inRepair: number;
  waitingParts: number;
  completed: number;
  unrepairable: number;
  totalEstimatedCost: number;
  totalActualCost: number;
}

// ─── User aliases ─────────────────────────────────────────────────────────────

const reporterUsers = alias(users, "reporter_users");
const assigneeUsers = alias(users, "assignee_users");

// ─── Get all repairs ──────────────────────────────────────────────────────────

export async function getAllRepairs(
  filters: RepairFilters = {}
): Promise<RepairListResult> {
  const {
    q,
    status,
    priority,
    assignedToId,
    page = 1,
    pageSize = 25,
  } = filters;

  const conditions: SQL[] = [];

  if (q) {
    conditions.push(
      or(
        ilike(tools.name, `%${q}%`),
        ilike(repairs.title, `%${q}%`),
        ilike(tools.assetId, `%${q}%`),
        ilike(repairs.vendorName, `%${q}%`)
      )!
    );
  }

  if (status) {
    conditions.push(eq(repairs.status, status as any));
  }

  if (priority) {
    conditions.push(eq(repairs.priority, priority as any));
  }

  if (assignedToId) {
    conditions.push(eq(repairs.assignedToId, assignedToId));
  }

  const whereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ value: count() })
    .from(repairs)
    .innerJoin(tools, eq(repairs.toolId, tools.id))
    .where(whereClause);

  const total = Number(countResult?.value ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const offset = (page - 1) * pageSize;

  // Count repair parts using a unique SQL alias.
  const partCountSq = db
    .select({
      repairId: repairParts.repairId,
      cnt: count().as("part_cnt"),
    })
    .from(repairParts)
    .groupBy(repairParts.repairId)
    .as("part_count");

  // Count repair notes using a different SQL alias.
  const noteCountSq = db
    .select({
      repairId: repairNotes.repairId,
      cnt: count().as("note_cnt"),
    })
    .from(repairNotes)
    .groupBy(repairNotes.repairId)
    .as("note_count");

  const rows = await db
    .select({
      id: repairs.id,
      toolId: repairs.toolId,
      toolName: tools.name,
      toolAssetId: tools.assetId,
      reportedById: repairs.reportedById,
      reportedByName: reporterUsers.name,
      assignedToId: repairs.assignedToId,
      assignedToName: assigneeUsers.name,
      vendorName: repairs.vendorName,
      status: repairs.status,
      priority: repairs.priority,
      title: repairs.title,
      description: repairs.description,
      estimatedCost: repairs.estimatedCost,
      actualCost: repairs.actualCost,
      estimatedCompletion: repairs.estimatedCompletion,
      startedAt: repairs.startedAt,
      completedAt: repairs.completedAt,
      partCount: partCountSq.cnt,
      noteCount: noteCountSq.cnt,
      createdAt: repairs.createdAt,
    })
    .from(repairs)
    .innerJoin(tools, eq(repairs.toolId, tools.id))
    .innerJoin(reporterUsers, eq(repairs.reportedById, reporterUsers.id))
    .leftJoin(assigneeUsers, eq(repairs.assignedToId, assigneeUsers.id))
    .leftJoin(partCountSq, eq(repairs.id, partCountSq.repairId))
    .leftJoin(noteCountSq, eq(repairs.id, noteCountSq.repairId))
    .where(whereClause)
    .orderBy(desc(repairs.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    repairs: rows.map((row) => ({
      id: row.id,
      toolId: row.toolId,
      toolName: row.toolName,
      toolAssetId: row.toolAssetId,
      reportedById: row.reportedById,
      reportedByName: row.reportedByName,
      assignedToId: row.assignedToId,
      assignedToName: row.assignedToName ?? null,
      vendorName: row.vendorName,
      status: row.status,
      priority: row.priority,
      title: row.title,
      description: row.description,
      estimatedCost: row.estimatedCost,
      actualCost: row.actualCost,
      estimatedCompletion: row.estimatedCompletion,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      partCount: Number(row.partCount ?? 0),
      noteCount: Number(row.noteCount ?? 0),
      createdAt: row.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}

// ─── Get repair by ID ─────────────────────────────────────────────────────────

export async function getRepairById(
  id: string
): Promise<RepairDetailRecord | null> {
  const [row] = await db
    .select({
      id: repairs.id,
      toolId: repairs.toolId,
      toolName: tools.name,
      toolAssetId: tools.assetId,
      toolBrand: tools.brand,
      toolModel: tools.model,
      toolStatus: tools.status,
      reportedById: repairs.reportedById,
      reportedByName: reporterUsers.name,
      assignedToId: repairs.assignedToId,
      assignedToName: assigneeUsers.name,
      vendorName: repairs.vendorName,
      status: repairs.status,
      priority: repairs.priority,
      title: repairs.title,
      description: repairs.description,
      diagnosis: repairs.diagnosis,
      resolution: repairs.resolution,
      estimatedCost: repairs.estimatedCost,
      actualCost: repairs.actualCost,
      estimatedCompletion: repairs.estimatedCompletion,
      startedAt: repairs.startedAt,
      completedAt: repairs.completedAt,
      inspectionRunId: repairs.inspectionRunId,
      createdAt: repairs.createdAt,
      updatedAt: repairs.updatedAt,
    })
    .from(repairs)
    .innerJoin(tools, eq(repairs.toolId, tools.id))
    .innerJoin(reporterUsers, eq(repairs.reportedById, reporterUsers.id))
    .leftJoin(assigneeUsers, eq(repairs.assignedToId, assigneeUsers.id))
    .where(eq(repairs.id, id))
    .limit(1);

  if (!row) {
    return null;
  }

  const parts = await db
    .select()
    .from(repairParts)
    .where(eq(repairParts.repairId, id))
    .orderBy(asc(repairParts.createdAt));

  const noteAuthor = alias(users, "note_author");

  const notes = await db
    .select({
      id: repairNotes.id,
      repairId: repairNotes.repairId,
      authorId: repairNotes.authorId,
      authorName: noteAuthor.name,
      content: repairNotes.content,
      isStatusChange: repairNotes.isStatusChange,
      oldStatus: repairNotes.oldStatus,
      newStatus: repairNotes.newStatus,
      createdAt: repairNotes.createdAt,
    })
    .from(repairNotes)
    .innerJoin(noteAuthor, eq(repairNotes.authorId, noteAuthor.id))
    .where(eq(repairNotes.repairId, id))
    .orderBy(desc(repairNotes.createdAt));

  return {
    id: row.id,
    toolId: row.toolId,
    toolName: row.toolName,
    toolAssetId: row.toolAssetId,
    toolBrand: row.toolBrand,
    toolModel: row.toolModel,
    toolStatus: row.toolStatus,
    reportedById: row.reportedById,
    reportedByName: row.reportedByName,
    assignedToId: row.assignedToId,
    assignedToName: row.assignedToName ?? null,
    vendorName: row.vendorName,
    status: row.status,
    priority: row.priority,
    title: row.title,
    description: row.description,
    diagnosis: row.diagnosis,
    resolution: row.resolution,
    estimatedCost: row.estimatedCost,
    actualCost: row.actualCost,
    estimatedCompletion: row.estimatedCompletion,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    inspectionRunId: row.inspectionRunId,
    partCount: parts.length,
    noteCount: notes.length,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    parts: parts.map((part) => ({
      id: part.id,
      repairId: part.repairId,
      name: part.name,
      partNumber: part.partNumber,
      quantity: part.quantity,
      unitCost: part.unitCost,
      vendor: part.vendor,
      isOrdered: part.isOrdered,
      isReceived: part.isReceived,
      notes: part.notes,
      createdAt: part.createdAt,
    })),
    notes: notes.map((note) => ({
      id: note.id,
      repairId: note.repairId,
      authorId: note.authorId,
      authorName: note.authorName,
      content: note.content,
      isStatusChange: note.isStatusChange,
      oldStatus: note.oldStatus,
      newStatus: note.newStatus,
      createdAt: note.createdAt,
    })),
  };
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getRepairStats(): Promise<RepairStats> {
  const statusRows = await db
    .select({
      status: repairs.status,
      cnt: count(),
    })
    .from(repairs)
    .groupBy(repairs.status);

  const statusMap: Record<string, number> = {};
  let total = 0;

  for (const row of statusRows) {
    statusMap[row.status] = Number(row.cnt);
    total += Number(row.cnt);
  }

  const [costResult] = await db
    .select({
      estTotal: sql<string>`
        coalesce(sum(${repairs.estimatedCost}::numeric), 0)
      `,
      actTotal: sql<string>`
        coalesce(sum(${repairs.actualCost}::numeric), 0)
      `,
    })
    .from(repairs);

  return {
    total,
    reported: statusMap["reported"] ?? 0,
    diagnosing: statusMap["diagnosing"] ?? 0,
    inRepair: statusMap["in_repair"] ?? 0,
    waitingParts: statusMap["waiting_parts"] ?? 0,
    completed: statusMap["completed"] ?? 0,
    unrepairable: statusMap["unrepairable"] ?? 0,
    totalEstimatedCost: parseFloat(costResult?.estTotal ?? "0"),
    totalActualCost: parseFloat(costResult?.actTotal ?? "0"),
  };
}

// ─── Staff dropdown ───────────────────────────────────────────────────────────

export async function getStaffForRepairDropdown(): Promise<
  { id: string; name: string; email: string }[]
> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
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

  return rows.map((row) => ({
    id: row.id,
    name: row.name ?? "",
    email: row.email,
  }));
}

// ─── Tool dropdown ────────────────────────────────────────────────────────────

export async function getToolsForRepairDropdown(): Promise<
  { id: string; name: string; assetId: string | null }[]
> {
  return db
    .select({
      id: tools.id,
      name: tools.name,
      assetId: tools.assetId,
    })
    .from(tools)
    .where(eq(tools.isActive, true))
    .orderBy(asc(tools.name));
}