import { db } from "@/db";
import {
  toolMaintenanceRecords,
  maintenanceSchedules,
  maintenanceAssignments,
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
  lte,
  type SQL,
} from "drizzle-orm";

// ─── Record types ─────────────────────────────────────────────────────────────

export interface MaintenanceRecordListItem {
  id: string;
  toolId: string;
  toolName: string;
  toolAssetId: string | null;
  performedById: string | null;
  performedByName: string | null;
  maintenanceType: string;
  description: string;
  cost: string | null;
  performedAt: Date;
  nextDueAt: Date | null;
  notes: string | null;
  createdAt: Date;
  assignmentCount: number;
}

export interface MaintenanceRecordDetail extends MaintenanceRecordListItem {
  toolBrand: string | null;
  toolModel: string | null;
  toolStatus: string;
  assignments: AssignmentRecord[];
}

export interface AssignmentRecord {
  id: string;
  assignedToId: string;
  assignedToName: string | null;
  assignedToEmail: string;
  status: string;
  assignedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
}

export interface ScheduleListItem {
  id: string;
  toolId: string;
  toolName: string;
  toolAssetId: string | null;
  maintenanceType: string;
  title: string;
  description: string | null;
  intervalDays: number;
  lastPerformedAt: Date | null;
  nextDueAt: Date;
  status: string;
  createdByName: string | null;
  isOverdue: boolean;
  createdAt: Date;
}

export interface MaintenanceRecordFilters {
  q?: string;
  maintenanceType?: string;
  toolId?: string;
  page?: number;
  pageSize?: number;
}

export interface MaintenanceRecordListResult {
  records: MaintenanceRecordListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ScheduleFilters {
  q?: string;
  status?: string;
  maintenanceType?: string;
  overdueOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ScheduleListResult {
  schedules: ScheduleListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MaintenanceStats {
  totalRecords: number;
  totalSchedules: number;
  activeSchedules: number;
  overdueSchedules: number;
  totalCost: number;
  pendingAssignments: number;
}

// ─── Get all maintenance records ──────────────────────────────────────────────

export async function getAllMaintenanceRecords(
  filters: MaintenanceRecordFilters = {}
): Promise<MaintenanceRecordListResult> {
  const { q, maintenanceType, toolId, page = 1, pageSize = 25 } = filters;

  const conditions: SQL[] = [];

  if (q) {
    conditions.push(
      or(
        ilike(tools.name, `%${q}%`),
        ilike(toolMaintenanceRecords.description, `%${q}%`),
        ilike(tools.assetId, `%${q}%`)
      )!
    );
  }

  if (maintenanceType) {
    conditions.push(
      eq(toolMaintenanceRecords.maintenanceType, maintenanceType as any)
    );
  }

  if (toolId) {
    conditions.push(eq(toolMaintenanceRecords.toolId, toolId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ value: count() })
    .from(toolMaintenanceRecords)
    .innerJoin(tools, eq(toolMaintenanceRecords.toolId, tools.id))
    .where(whereClause);

  const total = countResult?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const offset = (page - 1) * pageSize;

  const assignCountSq = db
    .select({
      recordId: maintenanceAssignments.maintenanceRecordId,
      cnt: count().as("cnt"),
    })
    .from(maintenanceAssignments)
    .groupBy(maintenanceAssignments.maintenanceRecordId)
    .as("assign_count");

  const rows = await db
    .select({
      id: toolMaintenanceRecords.id,
      toolId: toolMaintenanceRecords.toolId,
      toolName: tools.name,
      toolAssetId: tools.assetId,
      performedById: toolMaintenanceRecords.performedById,
      performedByName: users.name,
      maintenanceType: toolMaintenanceRecords.maintenanceType,
      description: toolMaintenanceRecords.description,
      cost: toolMaintenanceRecords.cost,
      performedAt: toolMaintenanceRecords.performedAt,
      nextDueAt: toolMaintenanceRecords.nextDueAt,
      notes: toolMaintenanceRecords.notes,
      createdAt: toolMaintenanceRecords.createdAt,
      assignmentCount: assignCountSq.cnt,
    })
    .from(toolMaintenanceRecords)
    .innerJoin(tools, eq(toolMaintenanceRecords.toolId, tools.id))
    .leftJoin(users, eq(toolMaintenanceRecords.performedById, users.id))
    .leftJoin(
      assignCountSq,
      eq(toolMaintenanceRecords.id, assignCountSq.recordId)
    )
    .where(whereClause)
    .orderBy(desc(toolMaintenanceRecords.performedAt))
    .limit(pageSize)
    .offset(offset);

  return {
    records: rows.map((r) => ({
      id: r.id,
      toolId: r.toolId,
      toolName: r.toolName,
      toolAssetId: r.toolAssetId,
      performedById: r.performedById,
      performedByName: r.performedByName,
      maintenanceType: r.maintenanceType,
      description: r.description,
      cost: r.cost,
      performedAt: r.performedAt,
      nextDueAt: r.nextDueAt,
      notes: r.notes,
      createdAt: r.createdAt,
      assignmentCount: Number(r.assignmentCount ?? 0),
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}

// ─── Get record by ID ─────────────────────────────────────────────────────────

export async function getMaintenanceRecordById(
  id: string
): Promise<MaintenanceRecordDetail | null> {
  const [row] = await db
    .select({
      id: toolMaintenanceRecords.id,
      toolId: toolMaintenanceRecords.toolId,
      toolName: tools.name,
      toolAssetId: tools.assetId,
      toolBrand: tools.brand,
      toolModel: tools.model,
      toolStatus: tools.status,
      performedById: toolMaintenanceRecords.performedById,
      performedByName: users.name,
      maintenanceType: toolMaintenanceRecords.maintenanceType,
      description: toolMaintenanceRecords.description,
      cost: toolMaintenanceRecords.cost,
      performedAt: toolMaintenanceRecords.performedAt,
      nextDueAt: toolMaintenanceRecords.nextDueAt,
      notes: toolMaintenanceRecords.notes,
      createdAt: toolMaintenanceRecords.createdAt,
    })
    .from(toolMaintenanceRecords)
    .innerJoin(tools, eq(toolMaintenanceRecords.toolId, tools.id))
    .leftJoin(users, eq(toolMaintenanceRecords.performedById, users.id))
    .where(eq(toolMaintenanceRecords.id, id))
    .limit(1);

  if (!row) return null;

  const assignmentRows = await db
    .select({
      id: maintenanceAssignments.id,
      assignedToId: maintenanceAssignments.assignedToId,
      assignedToName: users.name,
      assignedToEmail: users.email,
      status: maintenanceAssignments.status,
      assignedAt: maintenanceAssignments.assignedAt,
      startedAt: maintenanceAssignments.startedAt,
      completedAt: maintenanceAssignments.completedAt,
      notes: maintenanceAssignments.notes,
    })
    .from(maintenanceAssignments)
    .innerJoin(users, eq(maintenanceAssignments.assignedToId, users.id))
    .where(eq(maintenanceAssignments.maintenanceRecordId, id))
    .orderBy(desc(maintenanceAssignments.assignedAt));

  return {
    id: row.id,
    toolId: row.toolId,
    toolName: row.toolName,
    toolAssetId: row.toolAssetId,
    toolBrand: row.toolBrand,
    toolModel: row.toolModel,
    toolStatus: row.toolStatus,
    performedById: row.performedById,
    performedByName: row.performedByName,
    maintenanceType: row.maintenanceType,
    description: row.description,
    cost: row.cost,
    performedAt: row.performedAt,
    nextDueAt: row.nextDueAt,
    notes: row.notes,
    createdAt: row.createdAt,
    assignmentCount: assignmentRows.length,
    assignments: assignmentRows.map((a) => ({
      id: a.id,
      assignedToId: a.assignedToId,
      assignedToName: a.assignedToName,
      assignedToEmail: a.assignedToEmail,
      status: a.status,
      assignedAt: a.assignedAt,
      startedAt: a.startedAt,
      completedAt: a.completedAt,
      notes: a.notes,
    })),
  };
}

// ─── Get all schedules ────────────────────────────────────────────────────────

export async function getAllSchedules(
  filters: ScheduleFilters = {}
): Promise<ScheduleListResult> {
  const { q, status, maintenanceType, overdueOnly, page = 1, pageSize = 25 } = filters;

  const conditions: SQL[] = [];

  if (q) {
    conditions.push(
      or(
        ilike(tools.name, `%${q}%`),
        ilike(maintenanceSchedules.title, `%${q}%`),
        ilike(tools.assetId, `%${q}%`)
      )!
    );
  }

  if (status) {
    conditions.push(eq(maintenanceSchedules.status, status as any));
  }

  if (maintenanceType) {
    conditions.push(
      eq(maintenanceSchedules.maintenanceType, maintenanceType as any)
    );
  }

  if (overdueOnly) {
    conditions.push(
      and(
        eq(maintenanceSchedules.status, "active"),
        lte(maintenanceSchedules.nextDueAt, new Date())
      )!
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ value: count() })
    .from(maintenanceSchedules)
    .innerJoin(tools, eq(maintenanceSchedules.toolId, tools.id))
    .where(whereClause);

  const total = countResult?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const offset = (page - 1) * pageSize;

  const rows = await db
    .select({
      id: maintenanceSchedules.id,
      toolId: maintenanceSchedules.toolId,
      toolName: tools.name,
      toolAssetId: tools.assetId,
      maintenanceType: maintenanceSchedules.maintenanceType,
      title: maintenanceSchedules.title,
      description: maintenanceSchedules.description,
      intervalDays: maintenanceSchedules.intervalDays,
      lastPerformedAt: maintenanceSchedules.lastPerformedAt,
      nextDueAt: maintenanceSchedules.nextDueAt,
      status: maintenanceSchedules.status,
      createdByName: users.name,
      createdAt: maintenanceSchedules.createdAt,
    })
    .from(maintenanceSchedules)
    .innerJoin(tools, eq(maintenanceSchedules.toolId, tools.id))
    .leftJoin(users, eq(maintenanceSchedules.createdById, users.id))
    .where(whereClause)
    .orderBy(asc(maintenanceSchedules.nextDueAt))
    .limit(pageSize)
    .offset(offset);

  const now = new Date();

  return {
    schedules: rows.map((r) => ({
      id: r.id,
      toolId: r.toolId,
      toolName: r.toolName,
      toolAssetId: r.toolAssetId,
      maintenanceType: r.maintenanceType,
      title: r.title,
      description: r.description,
      intervalDays: r.intervalDays,
      lastPerformedAt: r.lastPerformedAt,
      nextDueAt: r.nextDueAt,
      status: r.status,
      createdByName: r.createdByName,
      isOverdue: r.status === "active" && r.nextDueAt <= now,
      createdAt: r.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}

// ─── Get overdue schedules ────────────────────────────────────────────────────

export async function getOverdueSchedules(
  limit = 10
): Promise<ScheduleListItem[]> {
  const now = new Date();

  const rows = await db
    .select({
      id: maintenanceSchedules.id,
      toolId: maintenanceSchedules.toolId,
      toolName: tools.name,
      toolAssetId: tools.assetId,
      maintenanceType: maintenanceSchedules.maintenanceType,
      title: maintenanceSchedules.title,
      description: maintenanceSchedules.description,
      intervalDays: maintenanceSchedules.intervalDays,
      lastPerformedAt: maintenanceSchedules.lastPerformedAt,
      nextDueAt: maintenanceSchedules.nextDueAt,
      status: maintenanceSchedules.status,
      createdByName: users.name,
      createdAt: maintenanceSchedules.createdAt,
    })
    .from(maintenanceSchedules)
    .innerJoin(tools, eq(maintenanceSchedules.toolId, tools.id))
    .leftJoin(users, eq(maintenanceSchedules.createdById, users.id))
    .where(
      and(
        eq(maintenanceSchedules.status, "active"),
        lte(maintenanceSchedules.nextDueAt, now)
      )
    )
    .orderBy(asc(maintenanceSchedules.nextDueAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    toolId: r.toolId,
    toolName: r.toolName,
    toolAssetId: r.toolAssetId,
    maintenanceType: r.maintenanceType,
    title: r.title,
    description: r.description,
    intervalDays: r.intervalDays,
    lastPerformedAt: r.lastPerformedAt,
    nextDueAt: r.nextDueAt,
    status: r.status,
    createdByName: r.createdByName,
    isOverdue: true,
    createdAt: r.createdAt,
  }));
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getMaintenanceStats(): Promise<MaintenanceStats> {
  const [recordCount] = await db
    .select({ value: count() })
    .from(toolMaintenanceRecords);

  const [scheduleStats] = await db
    .select({
      total: count(),
      active: sql<number>`count(*) filter (where ${maintenanceSchedules.status} = 'active')`,
    })
    .from(maintenanceSchedules);

  const now = new Date();
  const [overdueCount] = await db
    .select({ value: count() })
    .from(maintenanceSchedules)
    .where(
      and(
        eq(maintenanceSchedules.status, "active"),
        lte(maintenanceSchedules.nextDueAt, now)
      )
    );

  const [costResult] = await db
    .select({
      total: sql<string>`coalesce(sum(${toolMaintenanceRecords.cost}::numeric), 0)`,
    })
    .from(toolMaintenanceRecords);

  const [pendingAssign] = await db
    .select({ value: count() })
    .from(maintenanceAssignments)
    .where(eq(maintenanceAssignments.status, "pending"));

  return {
    totalRecords: Number(recordCount?.value ?? 0),
    totalSchedules: Number(scheduleStats?.total ?? 0),
    activeSchedules: Number(scheduleStats?.active ?? 0),
    overdueSchedules: Number(overdueCount?.value ?? 0),
    totalCost: parseFloat(costResult?.total ?? "0"),
    pendingAssignments: Number(pendingAssign?.value ?? 0),
  };
}

// ─── Staff for dropdown ───────────────────────────────────────────────────────

export async function getStaffForDropdown(): Promise<
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

  return rows.map((r) => ({
    id: r.id,
    name: r.name ?? "",
    email: r.email,
  }));
}

export async function getToolsForMaintenanceDropdown(): Promise<
  { id: string; name: string; assetId: string | null }[]
> {
  return db
    .select({ id: tools.id, name: tools.name, assetId: tools.assetId })
    .from(tools)
    .where(eq(tools.isActive, true))
    .orderBy(asc(tools.name));
}