import { db } from "@/db";
import {
  inspectionTemplates,
  inspectionTemplateItems,
  inspectionRuns,
  inspectionRunItems,
  categories,
  tools,
  users,
  reservations,
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

// ─── Template types ───────────────────────────────────────────────────────────

export interface TemplateListRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  triggerType: string;
  status: string;
  sortOrder: number;
  itemCount: number;
  runCount: number;
  createdAt: Date;
}

export interface TemplateDetailRecord extends TemplateListRecord {
  updatedAt: Date;
  items: TemplateItemRecord[];
}

export interface TemplateItemRecord {
  id: string;
  templateId: string;
  label: string;
  description: string | null;
  isCritical: boolean;
  sortOrder: number;
  createdAt: Date;
}

export interface TemplateFilters {
  q?: string;
  status?: string;
  categoryId?: string;
  triggerType?: string;
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

// ─── Run types ────────────────────────────────────────────────────────────────

export interface RunListRecord {
  id: string;
  templateId: string;
  templateName: string;
  toolId: string;
  toolName: string;
  toolAssetId: string | null;
  reservationId: string | null;
  performedById: string;
  performedByName: string | null;
  triggerType: string;
  status: string;
  notes: string | null;
  flaggedForRepair: boolean;
  completedAt: Date | null;
  createdAt: Date;
  passCount: number;
  failCount: number;
  totalItems: number;
}

export interface RunDetailRecord extends RunListRecord {
  updatedAt: Date;
  items: RunItemRecord[];
}

export interface RunItemRecord {
  id: string;
  runId: string;
  templateItemId: string;
  label: string;
  description: string | null;
  isCritical: boolean;
  result: string;
  notes: string | null;
  sortOrder: number;
}

export interface RunFilters {
  q?: string;
  status?: string;
  toolId?: string;
  templateId?: string;
  triggerType?: string;
  flaggedOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface RunListResult {
  runs: RunListRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface InspectionStats {
  totalTemplates: number;
  activeTemplates: number;
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  flaggedRuns: number;
  inProgressRuns: number;
}

// ─── Get all templates ────────────────────────────────────────────────────────

export async function getAllTemplates(
  filters: TemplateFilters = {}
): Promise<TemplateListResult> {
  const { q, status, categoryId, triggerType, page = 1, pageSize = 25 } =
    filters;

  const conditions: SQL[] = [];

  if (q) {
    conditions.push(
      or(
        ilike(inspectionTemplates.name, `%${q}%`),
        ilike(inspectionTemplates.description, `%${q}%`)
      )!
    );
  }

  if (status) {
    conditions.push(eq(inspectionTemplates.status, status as any));
  }

  if (categoryId) {
    conditions.push(eq(inspectionTemplates.categoryId, categoryId));
  }

  if (triggerType) {
    conditions.push(eq(inspectionTemplates.triggerType, triggerType as any));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ value: count() })
    .from(inspectionTemplates)
    .leftJoin(categories, eq(inspectionTemplates.categoryId, categories.id))
    .where(whereClause);

  const total = countResult?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const offset = (page - 1) * pageSize;

  const itemCountSq = db
    .select({
      templateId: inspectionTemplateItems.templateId,
      cnt: count().as("item_cnt"), // ← unique alias
    })
    .from(inspectionTemplateItems)
    .groupBy(inspectionTemplateItems.templateId)
    .as("item_count");

  const runCountSq = db
    .select({
      templateId: inspectionRuns.templateId,
      cnt: count().as("run_cnt"), // ← unique alias
    })
    .from(inspectionRuns)
    .groupBy(inspectionRuns.templateId)
    .as("run_count");

  const rows = await db
    .select({
      id: inspectionTemplates.id,
      name: inspectionTemplates.name,
      slug: inspectionTemplates.slug,
      description: inspectionTemplates.description,
      categoryId: inspectionTemplates.categoryId,
      categoryName: categories.name,
      triggerType: inspectionTemplates.triggerType,
      status: inspectionTemplates.status,
      sortOrder: inspectionTemplates.sortOrder,
      itemCount: itemCountSq.cnt,
      runCount: runCountSq.cnt,
      createdAt: inspectionTemplates.createdAt,
    })
    .from(inspectionTemplates)
    .leftJoin(categories, eq(inspectionTemplates.categoryId, categories.id))
    .leftJoin(itemCountSq, eq(inspectionTemplates.id, itemCountSq.templateId))
    .leftJoin(runCountSq, eq(inspectionTemplates.id, runCountSq.templateId))
    .where(whereClause)
    .orderBy(asc(inspectionTemplates.sortOrder), asc(inspectionTemplates.name))
    .limit(pageSize)
    .offset(offset);

  return {
    templates: rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      categoryId: r.categoryId,
      categoryName: r.categoryName ?? null,
      triggerType: r.triggerType,
      status: r.status,
      sortOrder: r.sortOrder,
      itemCount: Number(r.itemCount ?? 0),
      runCount: Number(r.runCount ?? 0),
      createdAt: r.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}

// ─── Get template by ID with items ────────────────────────────────────────────

export async function getTemplateById(
  id: string
): Promise<TemplateDetailRecord | null> {
  const [row] = await db
    .select({
      id: inspectionTemplates.id,
      name: inspectionTemplates.name,
      slug: inspectionTemplates.slug,
      description: inspectionTemplates.description,
      categoryId: inspectionTemplates.categoryId,
      categoryName: categories.name,
      triggerType: inspectionTemplates.triggerType,
      status: inspectionTemplates.status,
      sortOrder: inspectionTemplates.sortOrder,
      createdAt: inspectionTemplates.createdAt,
      updatedAt: inspectionTemplates.updatedAt,
    })
    .from(inspectionTemplates)
    .leftJoin(categories, eq(inspectionTemplates.categoryId, categories.id))
    .where(eq(inspectionTemplates.id, id))
    .limit(1);

  if (!row) return null;

  const items = await db
    .select()
    .from(inspectionTemplateItems)
    .where(eq(inspectionTemplateItems.templateId, id))
    .orderBy(asc(inspectionTemplateItems.sortOrder));

  const itemCountSq = db
    .select({
      templateId: inspectionTemplateItems.templateId,
      cnt: count().as("ic_cnt"), // ← unique alias
    })
    .from(inspectionTemplateItems)
    .where(eq(inspectionTemplateItems.templateId, id))
    .groupBy(inspectionTemplateItems.templateId)
    .as("ic");

  const runCountSq = db
    .select({
      templateId: inspectionRuns.templateId,
      cnt: count().as("rc_cnt"), // ← unique alias
    })
    .from(inspectionRuns)
    .where(eq(inspectionRuns.templateId, id))
    .groupBy(inspectionRuns.templateId)
    .as("rc");

  const [counts] = await db
    .select({
      itemCount: itemCountSq.cnt,
      runCount: runCountSq.cnt,
    })
    .from(inspectionTemplates)
    .leftJoin(itemCountSq, eq(inspectionTemplates.id, itemCountSq.templateId))
    .leftJoin(runCountSq, eq(inspectionTemplates.id, runCountSq.templateId))
    .where(eq(inspectionTemplates.id, id))
    .limit(1);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    categoryId: row.categoryId,
    categoryName: row.categoryName ?? null,
    triggerType: row.triggerType,
    status: row.status,
    sortOrder: row.sortOrder,
    itemCount: Number(counts?.itemCount ?? 0),
    runCount: Number(counts?.runCount ?? 0),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    items: items.map((i) => ({
      id: i.id,
      templateId: i.templateId,
      label: i.label,
      description: i.description,
      isCritical: i.isCritical,
      sortOrder: i.sortOrder,
      createdAt: i.createdAt,
    })),
  };
}

// ─── Get all inspection runs ──────────────────────────────────────────────────

export async function getAllRuns(
  filters: RunFilters = {}
): Promise<RunListResult> {
  const {
    q,
    status,
    toolId,
    templateId,
    triggerType,
    flaggedOnly,
    page = 1,
    pageSize = 25,
  } = filters;

  const conditions: SQL[] = [];

  if (q) {
    conditions.push(
      or(
        ilike(tools.name, `%${q}%`),
        ilike(users.name, `%${q}%`),
        ilike(inspectionTemplates.name, `%${q}%`)
      )!
    );
  }

  if (status) {
    conditions.push(eq(inspectionRuns.status, status as any));
  }

  if (toolId) {
    conditions.push(eq(inspectionRuns.toolId, toolId));
  }

  if (templateId) {
    conditions.push(eq(inspectionRuns.templateId, templateId));
  }

  if (triggerType) {
    conditions.push(eq(inspectionRuns.triggerType, triggerType as any));
  }

  if (flaggedOnly) {
    conditions.push(eq(inspectionRuns.flaggedForRepair, true));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ value: count() })
    .from(inspectionRuns)
    .innerJoin(
      inspectionTemplates,
      eq(inspectionRuns.templateId, inspectionTemplates.id)
    )
    .innerJoin(tools, eq(inspectionRuns.toolId, tools.id))
    .innerJoin(users, eq(inspectionRuns.performedById, users.id))
    .where(whereClause);

  const total = countResult?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const offset = (page - 1) * pageSize;

  const passCountSq = db
    .select({
      runId: inspectionRunItems.runId,
      cnt: count().as("pass_cnt"), // ← unique alias
    })
    .from(inspectionRunItems)
    .where(eq(inspectionRunItems.result, "pass"))
    .groupBy(inspectionRunItems.runId)
    .as("pass_count");

  const failCountSq = db
    .select({
      runId: inspectionRunItems.runId,
      cnt: count().as("fail_cnt"), // ← unique alias
    })
    .from(inspectionRunItems)
    .where(eq(inspectionRunItems.result, "fail"))
    .groupBy(inspectionRunItems.runId)
    .as("fail_count");

  const totalItemsSq = db
    .select({
      runId: inspectionRunItems.runId,
      cnt: count().as("total_cnt"), // ← unique alias
    })
    .from(inspectionRunItems)
    .groupBy(inspectionRunItems.runId)
    .as("total_items");

  const rows = await db
    .select({
      id: inspectionRuns.id,
      templateId: inspectionRuns.templateId,
      templateName: inspectionTemplates.name,
      toolId: inspectionRuns.toolId,
      toolName: tools.name,
      toolAssetId: tools.assetId,
      reservationId: inspectionRuns.reservationId,
      performedById: inspectionRuns.performedById,
      performedByName: users.name,
      triggerType: inspectionRuns.triggerType,
      status: inspectionRuns.status,
      notes: inspectionRuns.notes,
      flaggedForRepair: inspectionRuns.flaggedForRepair,
      completedAt: inspectionRuns.completedAt,
      createdAt: inspectionRuns.createdAt,
      passCount: passCountSq.cnt,
      failCount: failCountSq.cnt,
      totalItems: totalItemsSq.cnt,
    })
    .from(inspectionRuns)
    .innerJoin(
      inspectionTemplates,
      eq(inspectionRuns.templateId, inspectionTemplates.id)
    )
    .innerJoin(tools, eq(inspectionRuns.toolId, tools.id))
    .innerJoin(users, eq(inspectionRuns.performedById, users.id))
    .leftJoin(passCountSq, eq(inspectionRuns.id, passCountSq.runId))
    .leftJoin(failCountSq, eq(inspectionRuns.id, failCountSq.runId))
    .leftJoin(totalItemsSq, eq(inspectionRuns.id, totalItemsSq.runId))
    .where(whereClause)
    .orderBy(desc(inspectionRuns.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    runs: rows.map((r) => ({
      id: r.id,
      templateId: r.templateId,
      templateName: r.templateName,
      toolId: r.toolId,
      toolName: r.toolName,
      toolAssetId: r.toolAssetId,
      reservationId: r.reservationId,
      performedById: r.performedById,
      performedByName: r.performedByName,
      triggerType: r.triggerType,
      status: r.status,
      notes: r.notes,
      flaggedForRepair: r.flaggedForRepair,
      completedAt: r.completedAt,
      createdAt: r.createdAt,
      passCount: Number(r.passCount ?? 0),
      failCount: Number(r.failCount ?? 0),
      totalItems: Number(r.totalItems ?? 0),
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}

// ─── Get run by ID with items ─────────────────────────────────────────────────

export async function getRunById(
  id: string
): Promise<RunDetailRecord | null> {
  const [row] = await db
    .select({
      id: inspectionRuns.id,
      templateId: inspectionRuns.templateId,
      templateName: inspectionTemplates.name,
      toolId: inspectionRuns.toolId,
      toolName: tools.name,
      toolAssetId: tools.assetId,
      reservationId: inspectionRuns.reservationId,
      performedById: inspectionRuns.performedById,
      performedByName: users.name,
      triggerType: inspectionRuns.triggerType,
      status: inspectionRuns.status,
      notes: inspectionRuns.notes,
      flaggedForRepair: inspectionRuns.flaggedForRepair,
      completedAt: inspectionRuns.completedAt,
      createdAt: inspectionRuns.createdAt,
      updatedAt: inspectionRuns.updatedAt,
    })
    .from(inspectionRuns)
    .innerJoin(
      inspectionTemplates,
      eq(inspectionRuns.templateId, inspectionTemplates.id)
    )
    .innerJoin(tools, eq(inspectionRuns.toolId, tools.id))
    .innerJoin(users, eq(inspectionRuns.performedById, users.id))
    .where(eq(inspectionRuns.id, id))
    .limit(1);

  if (!row) return null;

  const runItems = await db
    .select({
      id: inspectionRunItems.id,
      runId: inspectionRunItems.runId,
      templateItemId: inspectionRunItems.templateItemId,
      label: inspectionTemplateItems.label,
      description: inspectionTemplateItems.description,
      isCritical: inspectionTemplateItems.isCritical,
      result: inspectionRunItems.result,
      notes: inspectionRunItems.notes,
      sortOrder: inspectionTemplateItems.sortOrder,
    })
    .from(inspectionRunItems)
    .innerJoin(
      inspectionTemplateItems,
      eq(inspectionRunItems.templateItemId, inspectionTemplateItems.id)
    )
    .where(eq(inspectionRunItems.runId, id))
    .orderBy(asc(inspectionTemplateItems.sortOrder));

  const passCount = runItems.filter((i) => i.result === "pass").length;
  const failCount = runItems.filter((i) => i.result === "fail").length;

  return {
    id: row.id,
    templateId: row.templateId,
    templateName: row.templateName,
    toolId: row.toolId,
    toolName: row.toolName,
    toolAssetId: row.toolAssetId,
    reservationId: row.reservationId,
    performedById: row.performedById,
    performedByName: row.performedByName,
    triggerType: row.triggerType,
    status: row.status,
    notes: row.notes,
    flaggedForRepair: row.flaggedForRepair,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    passCount,
    failCount,
    totalItems: runItems.length,
    items: runItems.map((i) => ({
      id: i.id,
      runId: i.runId,
      templateItemId: i.templateItemId,
      label: i.label,
      description: i.description,
      isCritical: i.isCritical,
      result: i.result,
      notes: i.notes,
      sortOrder: i.sortOrder,
    })),
  };
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getInspectionStats(): Promise<InspectionStats> {
  const [templateStats] = await db
    .select({
      total: count(),
      active: sql<number>`count(*) filter (where ${inspectionTemplates.status} = 'active')`,
    })
    .from(inspectionTemplates);

  const runStats = await db
    .select({
      status: inspectionRuns.status,
      cnt: count(),
    })
    .from(inspectionRuns)
    .groupBy(inspectionRuns.status);

  const runMap: Record<string, number> = {};
  let totalRuns = 0;
  for (const r of runStats) {
    runMap[r.status] = Number(r.cnt);
    totalRuns += Number(r.cnt);
  }

  return {
    totalTemplates: Number(templateStats?.total ?? 0),
    activeTemplates: Number(templateStats?.active ?? 0),
    totalRuns,
    passedRuns: runMap["passed"] ?? 0,
    failedRuns: runMap["failed"] ?? 0,
    flaggedRuns: runMap["flagged"] ?? 0,
    inProgressRuns: runMap["in_progress"] ?? 0,
  };
}

// ─── Dropdowns ────────────────────────────────────────────────────────────────

export async function getActiveTemplatesForDropdown(): Promise<
  { id: string; name: string }[]
> {
  return db
    .select({ id: inspectionTemplates.id, name: inspectionTemplates.name })
    .from(inspectionTemplates)
    .where(eq(inspectionTemplates.status, "active"))
    .orderBy(asc(inspectionTemplates.name));
}

export async function getTemplateItemsForRun(
  templateId: string
): Promise<TemplateItemRecord[]> {
  const rows = await db
    .select()
    .from(inspectionTemplateItems)
    .where(eq(inspectionTemplateItems.templateId, templateId))
    .orderBy(asc(inspectionTemplateItems.sortOrder));

  return rows.map((r) => ({
    id: r.id,
    templateId: r.templateId,
    label: r.label,
    description: r.description,
    isCritical: r.isCritical,
    sortOrder: r.sortOrder,
    createdAt: r.createdAt,
  }));
}

export async function getToolsForInspectionDropdown(): Promise<
  { id: string; name: string; assetId: string | null }[]
> {
  return db
    .select({ id: tools.id, name: tools.name, assetId: tools.assetId })
    .from(tools)
    .where(eq(tools.isActive, true))
    .orderBy(asc(tools.name));
}

export async function getCategoriesForInspectionDropdown(): Promise<
  { id: string; name: string }[]
> {
  return db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.status, "active"))
    .orderBy(asc(categories.name));
}