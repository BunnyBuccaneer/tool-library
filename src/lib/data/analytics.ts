import { db } from "@/db";
import {
  tools,
  reservations,
  toolMaintenanceRecords,
  repairs,
  repairParts,
  categories,
  users,
  memberProfiles,
  locations,
} from "@/db/schema";
import {
  eq,
  and,
  or,
  sql,
  desc,
  asc,
  count,
  gte,
  lte,
} from "drizzle-orm";

// ─── Most / Least Used Tools ──────────────────────────────────────────────────

export interface ToolUsageRecord {
  id: string;
  name: string;
  assetId: string | null;
  categoryName: string | null;
  status: string;
  reservationCount: number;
  checkedOutCount: number;
  returnedCount: number;
  cancelledCount: number;
  overdueCount: number;
  lastReservedAt: Date | null;
}

export async function getMostUsedTools(limit = 20): Promise<ToolUsageRecord[]> {
  return getToolUsage("desc", limit);
}

export async function getLeastUsedTools(limit = 20): Promise<ToolUsageRecord[]> {
  return getToolUsage("asc", limit);
}

async function getToolUsage(
  order: "asc" | "desc",
  limit: number
): Promise<ToolUsageRecord[]> {
  const totalResSq = db
    .select({
      toolId: reservations.toolId,
      total: count().as("total"),
      checkedOut: sql<number>`count(*) filter (where ${reservations.status} = 'checked_out')`.as("checked_out"),
      returned: sql<number>`count(*) filter (where ${reservations.status} = 'returned')`.as("returned"),
      cancelled: sql<number>`count(*) filter (where ${reservations.status} = 'cancelled')`.as("cancelled"),
      overdue: sql<number>`count(*) filter (where ${reservations.status} = 'overdue')`.as("overdue"),
      lastReserved: sql<Date>`max(${reservations.createdAt})`.as("last_reserved"),
    })
    .from(reservations)
    .groupBy(reservations.toolId)
    .as("res_stats");

  const rows = await db
    .select({
      id: tools.id,
      name: tools.name,
      assetId: tools.assetId,
      categoryName: categories.name,
      status: tools.status,
      reservationCount: totalResSq.total,
      checkedOutCount: totalResSq.checkedOut,
      returnedCount: totalResSq.returned,
      cancelledCount: totalResSq.cancelled,
      overdueCount: totalResSq.overdue,
      lastReservedAt: totalResSq.lastReserved,
    })
    .from(tools)
    .leftJoin(categories, eq(tools.categoryId, categories.id))
    .leftJoin(totalResSq, eq(tools.id, totalResSq.toolId))
    .where(eq(tools.isActive, true))
    .orderBy(
      order === "desc"
        ? desc(sql`coalesce(${totalResSq.total}, 0)`)
        : asc(sql`coalesce(${totalResSq.total}, 0)`)
    )
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    assetId: r.assetId,
    categoryName: r.categoryName ?? null,
    status: r.status,
    reservationCount: Number(r.reservationCount ?? 0),
    checkedOutCount: Number(r.checkedOutCount ?? 0),
    returnedCount: Number(r.returnedCount ?? 0),
    cancelledCount: Number(r.cancelledCount ?? 0),
    overdueCount: Number(r.overdueCount ?? 0),
    lastReservedAt: r.lastReservedAt ?? null,
  }));
}

// ─── Reservation trends ──────────────────────────────────────────────────────

export interface MonthlyReservation {
  month: string;
  total: number;
  completed: number;
  cancelled: number;
  overdue: number;
}

export async function getMonthlyReservations(
  months = 12
): Promise<MonthlyReservation[]> {
  const rows = await db
    .select({
      month: sql<string>`to_char(${reservations.createdAt}, 'YYYY-MM')`,
      total: count(),
      completed: sql<number>`count(*) filter (where ${reservations.status} = 'returned')`,
      cancelled: sql<number>`count(*) filter (where ${reservations.status} = 'cancelled')`,
      overdue: sql<number>`count(*) filter (where ${reservations.status} = 'overdue')`,
    })
    .from(reservations)
    .where(
      gte(
        reservations.createdAt,
        sql`now() - interval '${sql.raw(String(months))} months'`
      )
    )
    .groupBy(sql`to_char(${reservations.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${reservations.createdAt}, 'YYYY-MM')`);

  // Fill empty months
  const monthMap = new Map<string, MonthlyReservation>();
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, { month: key, total: 0, completed: 0, cancelled: 0, overdue: 0 });
  }

  for (const r of rows) {
    const entry = monthMap.get(r.month);
    if (entry) {
      entry.total = Number(r.total);
      entry.completed = Number(r.completed);
      entry.cancelled = Number(r.cancelled);
      entry.overdue = Number(r.overdue);
    }
  }

  return Array.from(monthMap.values());
}

// ─── Category usage breakdown ─────────────────────────────────────────────────

export interface CategoryUsageRecord {
  categoryName: string;
  toolCount: number;
  totalReservations: number;
  activeReservations: number;
}

export async function getCategoryUsage(): Promise<CategoryUsageRecord[]> {
  const rows = await db
    .select({
      categoryName: categories.name,
      toolCount: sql<number>`count(distinct ${tools.id})`,
      totalReservations: sql<number>`count(${reservations.id})`,
      activeReservations: sql<number>`count(*) filter (where ${reservations.status} in ('pending', 'confirmed', 'checked_out'))`,
    })
    .from(tools)
    .leftJoin(categories, eq(tools.categoryId, categories.id))
    .leftJoin(reservations, eq(tools.id, reservations.toolId))
    .where(eq(tools.isActive, true))
    .groupBy(categories.name)
    .orderBy(desc(sql`count(${reservations.id})`));

  return rows.map((r) => ({
    categoryName: r.categoryName ?? "Uncategorized",
    toolCount: Number(r.toolCount),
    totalReservations: Number(r.totalReservations),
    activeReservations: Number(r.activeReservations),
  }));
}

// ─── Location usage breakdown ─────────────────────────────────────────────────

export interface LocationUsageRecord {
  locationName: string;
  toolCount: number;
  totalReservations: number;
}

export async function getLocationUsage(): Promise<LocationUsageRecord[]> {
  const rows = await db
    .select({
      locationName: locations.name,
      toolCount: sql<number>`count(distinct ${tools.id})`,
      totalReservations: sql<number>`count(${reservations.id})`,
    })
    .from(tools)
    .leftJoin(locations, eq(tools.locationId, locations.id))
    .leftJoin(reservations, eq(tools.id, reservations.toolId))
    .where(eq(tools.isActive, true))
    .groupBy(locations.name)
    .orderBy(desc(sql`count(${reservations.id})`));

  return rows.map((r) => ({
    locationName: r.locationName ?? "No Location",
    toolCount: Number(r.toolCount),
    totalReservations: Number(r.totalReservations),
  }));
}

// ─── Maintenance cost analytics ───────────────────────────────────────────────

export interface MaintenanceCostByType {
  maintenanceType: string;
  recordCount: number;
  totalCost: number;
  avgCost: number;
}

export async function getMaintenanceCostByType(): Promise<MaintenanceCostByType[]> {
  const rows = await db
    .select({
      maintenanceType: toolMaintenanceRecords.maintenanceType,
      recordCount: count(),
      totalCost: sql<string>`coalesce(sum(${toolMaintenanceRecords.cost}::numeric), 0)`,
      avgCost: sql<string>`coalesce(avg(${toolMaintenanceRecords.cost}::numeric), 0)`,
    })
    .from(toolMaintenanceRecords)
    .groupBy(toolMaintenanceRecords.maintenanceType)
    .orderBy(desc(sql`sum(${toolMaintenanceRecords.cost}::numeric)`));

  return rows.map((r) => ({
    maintenanceType: r.maintenanceType,
    recordCount: Number(r.recordCount),
    totalCost: parseFloat(r.totalCost),
    avgCost: parseFloat(r.avgCost),
  }));
}

// ─── Repair analytics ─────────────────────────────────────────────────────────

export interface RepairAnalytics {
  totalRepairs: number;
  completedRepairs: number;
  unrepairableCount: number;
  avgRepairCost: number;
  avgDaysToComplete: number;
  topRepairTools: { toolName: string; repairCount: number }[];
}

export async function getRepairAnalytics(): Promise<RepairAnalytics> {
  const [totals] = await db
    .select({
      total: count(),
      completed: sql<number>`count(*) filter (where ${repairs.status} = 'completed')`,
      unrepairable: sql<number>`count(*) filter (where ${repairs.status} = 'unrepairable')`,
      avgCost: sql<string>`coalesce(avg(${repairs.actualCost}::numeric) filter (where ${repairs.actualCost} is not null), 0)`,
      avgDays: sql<string>`coalesce(avg(extract(epoch from (${repairs.completedAt} - ${repairs.createdAt})) / 86400) filter (where ${repairs.completedAt} is not null), 0)`,
    })
    .from(repairs);

  const topTools = await db
    .select({
      toolName: tools.name,
      repairCount: count(),
    })
    .from(repairs)
    .innerJoin(tools, eq(repairs.toolId, tools.id))
    .groupBy(tools.name)
    .orderBy(desc(count()))
    .limit(10);

  return {
    totalRepairs: Number(totals?.total ?? 0),
    completedRepairs: Number(totals?.completed ?? 0),
    unrepairableCount: Number(totals?.unrepairable ?? 0),
    avgRepairCost: parseFloat(totals?.avgCost ?? "0"),
    avgDaysToComplete: parseFloat(totals?.avgDays ?? "0"),
    topRepairTools: topTools.map((r) => ({
      toolName: r.toolName,
      repairCount: Number(r.repairCount),
    })),
  };
}

// ─── Replacement candidates ───────────────────────────────────────────────────

export interface ReplacementCandidate {
  id: string;
  name: string;
  assetId: string | null;
  categoryName: string | null;
  status: string;
  replacementCost: number;
  totalMaintenanceCost: number;
  totalRepairCost: number;
  totalCost: number;
  costRatio: number;
  repairCount: number;
  lastRepairDate: Date | null;
  reason: string;
}

export async function getReplacementCandidates(): Promise<ReplacementCandidate[]> {
  const maintCostSq = db
    .select({
      toolId: toolMaintenanceRecords.toolId,
      total: sql<string>`coalesce(sum(${toolMaintenanceRecords.cost}::numeric), 0)`.as("total"),
    })
    .from(toolMaintenanceRecords)
    .groupBy(toolMaintenanceRecords.toolId)
    .as("maint_cost");

  const repairCostSq = db
    .select({
      toolId: repairs.toolId,
      total: sql<string>`coalesce(sum(${repairs.actualCost}::numeric), 0)`.as("total"),
      repairCount: count().as("repair_count"),
      lastRepair: sql<Date>`max(${repairs.createdAt})`.as("last_repair"),
    })
    .from(repairs)
    .groupBy(repairs.toolId)
    .as("repair_cost");

  const rows = await db
    .select({
      id: tools.id,
      name: tools.name,
      assetId: tools.assetId,
      categoryName: categories.name,
      status: tools.status,
      replacementCost: tools.replacementCost,
      maintenanceCost: maintCostSq.total,
      repairCost: repairCostSq.total,
      repairCount: repairCostSq.repairCount,
      lastRepairDate: repairCostSq.lastRepair,
    })
    .from(tools)
    .leftJoin(categories, eq(tools.categoryId, categories.id))
    .leftJoin(maintCostSq, eq(tools.id, maintCostSq.toolId))
    .leftJoin(repairCostSq, eq(tools.id, repairCostSq.toolId))
    .where(eq(tools.isActive, true))
    .orderBy(
      desc(
        sql`coalesce(${maintCostSq.total}::numeric, 0) + coalesce(${repairCostSq.total}::numeric, 0)`
      )
    );

  const candidates: ReplacementCandidate[] = [];

  for (const r of rows) {
    const replacement = parseFloat(r.replacementCost ?? "0");
    const maint = parseFloat(r.maintenanceCost ?? "0");
    const repair = parseFloat(r.repairCost ?? "0");
    const totalCost = maint + repair;
    const repairCount = Number(r.repairCount ?? 0);

    if (replacement <= 0) continue;

    const costRatio = totalCost / replacement;

    // Flag if cost ratio > 50%, or 3+ repairs, or status is maintenance/retired
    const reasons: string[] = [];
    if (costRatio >= 0.75) reasons.push("Costs ≥75% of replacement");
    else if (costRatio >= 0.5) reasons.push("Costs ≥50% of replacement");
    if (repairCount >= 3) reasons.push(`${repairCount} repairs`);
    if (r.status === "maintenance") reasons.push("Currently in maintenance");
    if (r.status === "retired") reasons.push("Already retired");

    if (reasons.length === 0) continue;

    candidates.push({
      id: r.id,
      name: r.name,
      assetId: r.assetId,
      categoryName: r.categoryName ?? null,
      status: r.status,
      replacementCost: replacement,
      totalMaintenanceCost: maint,
      totalRepairCost: repair,
      totalCost,
      costRatio,
      repairCount,
      lastRepairDate: r.lastRepairDate ?? null,
      reason: reasons.join("; "),
    });
  }

  return candidates.sort((a, b) => b.costRatio - a.costRatio);
}

// ─── Member analytics ─────────────────────────────────────────────────────────

export interface MemberAnalytics {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  topBorrowers: { userName: string; email: string; reservationCount: number }[];
}

export async function getMemberAnalytics(): Promise<MemberAnalytics> {
  const [memberStats] = await db
    .select({
      total: count(),
      active: sql<number>`count(*) filter (where ${memberProfiles.membershipStatus} = 'active')`,
    })
    .from(memberProfiles);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [newThisMonth] = await db
    .select({ cnt: count() })
    .from(memberProfiles)
    .where(gte(memberProfiles.createdAt, startOfMonth));

  const topBorrowers = await db
    .select({
      userName: users.name,
      email: users.email,
      reservationCount: count(),
    })
    .from(reservations)
    .innerJoin(users, eq(reservations.userId, users.id))
    .groupBy(users.name, users.email)
    .orderBy(desc(count()))
    .limit(10);

  return {
    totalMembers: Number(memberStats?.total ?? 0),
    activeMembers: Number(memberStats?.active ?? 0),
    newMembersThisMonth: Number(newThisMonth?.cnt ?? 0),
    topBorrowers: topBorrowers.map((r) => ({
      userName: r.userName ?? "No name",
      email: r.email,
      reservationCount: Number(r.reservationCount),
    })),
  };
}

// ─── Overview stats ───────────────────────────────────────────────────────────

export interface AnalyticsOverview {
  totalTools: number;
  totalReservations: number;
  totalMaintenanceRecords: number;
  totalRepairs: number;
  avgReservationsPerTool: number;
  overdueRate: number;
  cancellationRate: number;
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const [toolCount] = await db
    .select({ cnt: count() })
    .from(tools)
    .where(eq(tools.isActive, true));

  const [resStats] = await db
    .select({
      total: count(),
      overdue: sql<number>`count(*) filter (where ${reservations.status} = 'overdue')`,
      cancelled: sql<number>`count(*) filter (where ${reservations.status} = 'cancelled')`,
    })
    .from(reservations);

  const [maintCount] = await db
    .select({ cnt: count() })
    .from(toolMaintenanceRecords);

  const [repairCount] = await db
    .select({ cnt: count() })
    .from(repairs);

  const totalTools = Number(toolCount?.cnt ?? 0);
  const totalRes = Number(resStats?.total ?? 0);

  return {
    totalTools,
    totalReservations: totalRes,
    totalMaintenanceRecords: Number(maintCount?.cnt ?? 0),
    totalRepairs: Number(repairCount?.cnt ?? 0),
    avgReservationsPerTool: totalTools > 0 ? totalRes / totalTools : 0,
    overdueRate: totalRes > 0 ? (Number(resStats?.overdue ?? 0) / totalRes) * 100 : 0,
    cancellationRate: totalRes > 0 ? (Number(resStats?.cancelled ?? 0) / totalRes) * 100 : 0,
  };
}