import { db } from "@/db";
import {
  tools,
  toolMaintenanceRecords,
  repairs,
  repairParts,
  reservations,
  partnerRepairLinks,
  categories,
} from "@/db/schema";
import {
  eq,
  and,
  sql,
  desc,
  asc,
  count,
  gte,
  lte,
} from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FinancialSummary {
  totalReplacementValue: number;
  totalMaintenanceCost: number;
  totalRepairCost: number;
  totalPartsCost: number;
  totalVendorCost: number;
  totalCombinedCost: number;
  netPosition: number;
  activeToolCount: number;
  toolsInMaintenance: number;
  toolsRetired: number;
}

export interface MonthlyCost {
  month: string;
  maintenanceCost: number;
  repairCost: number;
  partsCost: number;
  totalCost: number;
}

export interface ToolFinancialRecord {
  id: string;
  name: string;
  assetId: string | null;
  categoryName: string | null;
  replacementCost: number;
  maintenanceCost: number;
  repairCost: number;
  partsCost: number;
  totalCost: number;
  netPosition: number;
  reservationCount: number;
  costPerReservation: number;
  status: string;
}

export interface CategoryFinancialRecord {
  categoryId: string | null;
  categoryName: string;
  toolCount: number;
  replacementValue: number;
  maintenanceCost: number;
  repairCost: number;
  totalCost: number;
}

export interface FinanceFilters {
  dateFrom?: string;
  dateTo?: string;
}

export interface CsvRow {
  toolName: string;
  assetId: string;
  category: string;
  status: string;
  replacementCost: string;
  maintenanceCost: string;
  repairCost: string;
  partsCost: string;
  totalCost: string;
  netPosition: string;
  reservationCount: string;
  costPerReservation: string;
}

// ─── Financial summary ────────────────────────────────────────────────────────

export async function getFinancialSummary(
  filters: FinanceFilters = {}
): Promise<FinancialSummary> {
  const { dateFrom, dateTo } = filters;

  // Replacement value
  const [replacementResult] = await db
    .select({
      total: sql<string>`coalesce(sum(${tools.replacementCost}::numeric), 0)`,
      activeCount: sql<number>`count(*) filter (where ${tools.status} != 'retired')`,
      maintenanceCount: sql<number>`count(*) filter (where ${tools.status} = 'maintenance')`,
      retiredCount: sql<number>`count(*) filter (where ${tools.status} = 'retired')`,
    })
    .from(tools)
    .where(eq(tools.isActive, true));

  // Maintenance costs
  const maintConditions = [];
  if (dateFrom)
    maintConditions.push(
      gte(toolMaintenanceRecords.performedAt, new Date(dateFrom))
    );
  if (dateTo)
    maintConditions.push(
      lte(toolMaintenanceRecords.performedAt, new Date(dateTo + "T23:59:59"))
    );

  const [maintResult] = await db
    .select({
      total: sql<string>`coalesce(sum(${toolMaintenanceRecords.cost}::numeric), 0)`,
    })
    .from(toolMaintenanceRecords)
    .where(maintConditions.length > 0 ? and(...maintConditions) : undefined);

  // Repair costs
  const repairConditions = [];
  if (dateFrom) repairConditions.push(gte(repairs.createdAt, new Date(dateFrom)));
  if (dateTo)
    repairConditions.push(
      lte(repairs.createdAt, new Date(dateTo + "T23:59:59"))
    );

  const [repairResult] = await db
    .select({
      total: sql<string>`coalesce(sum(${repairs.actualCost}::numeric), 0)`,
    })
    .from(repairs)
    .where(repairConditions.length > 0 ? and(...repairConditions) : undefined);

  // Parts costs
  const [partsResult] = await db
    .select({
      total: sql<string>`coalesce(sum(${repairParts.unitCost}::numeric * ${repairParts.quantity}), 0)`,
    })
    .from(repairParts)
    .innerJoin(repairs, eq(repairParts.repairId, repairs.id))
    .where(repairConditions.length > 0 ? and(...repairConditions) : undefined);

  // Vendor/partner costs
  const [vendorResult] = await db
    .select({
      total: sql<string>`coalesce(sum(${partnerRepairLinks.cost}::numeric), 0)`,
    })
    .from(partnerRepairLinks)
    .innerJoin(repairs, eq(partnerRepairLinks.repairId, repairs.id))
    .where(repairConditions.length > 0 ? and(...repairConditions) : undefined);

  const totalReplacementValue = parseFloat(replacementResult?.total ?? "0");
  const totalMaintenanceCost = parseFloat(maintResult?.total ?? "0");
  const totalRepairCost = parseFloat(repairResult?.total ?? "0");
  const totalPartsCost = parseFloat(partsResult?.total ?? "0");
  const totalVendorCost = parseFloat(vendorResult?.total ?? "0");
  const totalCombinedCost =
    totalMaintenanceCost + totalRepairCost + totalPartsCost + totalVendorCost;

  return {
    totalReplacementValue,
    totalMaintenanceCost,
    totalRepairCost,
    totalPartsCost,
    totalVendorCost,
    totalCombinedCost,
    netPosition: totalReplacementValue - totalCombinedCost,
    activeToolCount: Number(replacementResult?.activeCount ?? 0),
    toolsInMaintenance: Number(replacementResult?.maintenanceCount ?? 0),
    toolsRetired: Number(replacementResult?.retiredCount ?? 0),
  };
}

// ─── Monthly cost breakdown ───────────────────────────────────────────────────

export async function getMonthlyCosts(months = 12): Promise<MonthlyCost[]> {
  const maintRows = await db
    .select({
      month: sql<string>`to_char(${toolMaintenanceRecords.performedAt}, 'YYYY-MM')`,
      total: sql<string>`coalesce(sum(${toolMaintenanceRecords.cost}::numeric), 0)`,
    })
    .from(toolMaintenanceRecords)
    .where(
      gte(
        toolMaintenanceRecords.performedAt,
        sql`now() - interval '${sql.raw(String(months))} months'`
      )
    )
    .groupBy(sql`to_char(${toolMaintenanceRecords.performedAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${toolMaintenanceRecords.performedAt}, 'YYYY-MM')`);

  const repairRows = await db
    .select({
      month: sql<string>`to_char(${repairs.createdAt}, 'YYYY-MM')`,
      total: sql<string>`coalesce(sum(${repairs.actualCost}::numeric), 0)`,
    })
    .from(repairs)
    .where(
      gte(
        repairs.createdAt,
        sql`now() - interval '${sql.raw(String(months))} months'`
      )
    )
    .groupBy(sql`to_char(${repairs.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${repairs.createdAt}, 'YYYY-MM')`);

  const partsRows = await db
    .select({
      month: sql<string>`to_char(${repairParts.createdAt}, 'YYYY-MM')`,
      total: sql<string>`coalesce(sum(${repairParts.unitCost}::numeric * ${repairParts.quantity}), 0)`,
    })
    .from(repairParts)
    .where(
      gte(
        repairParts.createdAt,
        sql`now() - interval '${sql.raw(String(months))} months'`
      )
    )
    .groupBy(sql`to_char(${repairParts.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${repairParts.createdAt}, 'YYYY-MM')`);

  // Merge into monthly buckets
  const monthMap = new Map<string, MonthlyCost>();

  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, {
      month: key,
      maintenanceCost: 0,
      repairCost: 0,
      partsCost: 0,
      totalCost: 0,
    });
  }

  for (const r of maintRows) {
    const entry = monthMap.get(r.month);
    if (entry) entry.maintenanceCost = parseFloat(r.total);
  }

  for (const r of repairRows) {
    const entry = monthMap.get(r.month);
    if (entry) entry.repairCost = parseFloat(r.total);
  }

  for (const r of partsRows) {
    const entry = monthMap.get(r.month);
    if (entry) entry.partsCost = parseFloat(r.total);
  }

  for (const entry of monthMap.values()) {
    entry.totalCost =
      entry.maintenanceCost + entry.repairCost + entry.partsCost;
  }

  return Array.from(monthMap.values());
}

// ─── Per-tool financial data ──────────────────────────────────────────────────

export async function getToolFinancials(): Promise<ToolFinancialRecord[]> {
  const maintCostSq = db
    .select({
      toolId: toolMaintenanceRecords.toolId,
      total: sql<string>`coalesce(sum(${toolMaintenanceRecords.cost}::numeric), 0)`.as(
        "maint_total" // ← unique
      ),
    })
    .from(toolMaintenanceRecords)
    .groupBy(toolMaintenanceRecords.toolId)
    .as("maint_cost");

  const repairCostSq = db
    .select({
      toolId: repairs.toolId,
      total: sql<string>`coalesce(sum(${repairs.actualCost}::numeric), 0)`.as(
        "repair_total" // ← unique
      ),
    })
    .from(repairs)
    .groupBy(repairs.toolId)
    .as("repair_cost");

  const partsCostSq = db
    .select({
      toolId: repairs.toolId,
      total: sql<string>`coalesce(sum(${repairParts.unitCost}::numeric * ${repairParts.quantity}), 0)`.as(
        "parts_total" // ← unique
      ),
    })
    .from(repairParts)
    .innerJoin(repairs, eq(repairParts.repairId, repairs.id))
    .groupBy(repairs.toolId)
    .as("parts_cost");

  const resCountSq = db
    .select({
      toolId: reservations.toolId,
      cnt: count().as("res_cnt"), // ← unique
    })
    .from(reservations)
    .groupBy(reservations.toolId)
    .as("res_count");

  const rows = await db
    .select({
      id: tools.id,
      name: tools.name,
      assetId: tools.assetId,
      categoryName: categories.name,
      replacementCost: tools.replacementCost,
      maintenanceCost: maintCostSq.total,
      repairCost: repairCostSq.total,
      partsCost: partsCostSq.total,
      reservationCount: resCountSq.cnt,
      status: tools.status,
    })
    .from(tools)
    .leftJoin(categories, eq(tools.categoryId, categories.id))
    .leftJoin(maintCostSq, eq(tools.id, maintCostSq.toolId))
    .leftJoin(repairCostSq, eq(tools.id, repairCostSq.toolId))
    .leftJoin(partsCostSq, eq(tools.id, partsCostSq.toolId))
    .leftJoin(resCountSq, eq(tools.id, resCountSq.toolId))
    .where(eq(tools.isActive, true))
    .orderBy(
      desc(
        sql`coalesce(${maintCostSq.total}::numeric, 0) + coalesce(${repairCostSq.total}::numeric, 0) + coalesce(${partsCostSq.total}::numeric, 0)`
      )
    );

  return rows.map((r) => {
    const replacement = parseFloat(r.replacementCost ?? "0");
    const maint = parseFloat(r.maintenanceCost ?? "0");
    const repair = parseFloat(r.repairCost ?? "0");
    const parts = parseFloat(r.partsCost ?? "0");
    const totalCost = maint + repair + parts;
    const resCount = Number(r.reservationCount ?? 0);

    return {
      id: r.id,
      name: r.name,
      assetId: r.assetId,
      categoryName: r.categoryName ?? null,
      replacementCost: replacement,
      maintenanceCost: maint,
      repairCost: repair,
      partsCost: parts,
      totalCost,
      netPosition: replacement - totalCost,
      reservationCount: resCount,
      costPerReservation: resCount > 0 ? totalCost / resCount : 0,
      status: r.status,
    };
  });
}

// ─── Per-category financial data ──────────────────────────────────────────────

export async function getCategoryFinancials(): Promise<CategoryFinancialRecord[]> {
  const toolFinancials = await getToolFinancials();

  const categoryMap = new Map<string, CategoryFinancialRecord>();

  for (const t of toolFinancials) {
    const key = t.categoryName ?? "Uncategorized";
    const existing = categoryMap.get(key);
    if (existing) {
      existing.toolCount += 1;
      existing.replacementValue += t.replacementCost;
      existing.maintenanceCost += t.maintenanceCost;
      existing.repairCost += t.repairCost;
      existing.totalCost += t.totalCost;
    } else {
      categoryMap.set(key, {
        categoryId: null,
        categoryName: key,
        toolCount: 1,
        replacementValue: t.replacementCost,
        maintenanceCost: t.maintenanceCost,
        repairCost: t.repairCost,
        totalCost: t.totalCost,
      });
    }
  }

  return Array.from(categoryMap.values()).sort(
    (a, b) => b.totalCost - a.totalCost
  );
}

// ─── CSV export data ──────────────────────────────────────────────────────────

export async function getFinancialCsvData(): Promise<CsvRow[]> {
  const toolFinancials = await getToolFinancials();

  return toolFinancials.map((t) => ({
    toolName: t.name,
    assetId: t.assetId ?? "",
    category: t.categoryName ?? "Uncategorized",
    status: t.status,
    replacementCost: t.replacementCost.toFixed(2),
    maintenanceCost: t.maintenanceCost.toFixed(2),
    repairCost: t.repairCost.toFixed(2),
    partsCost: t.partsCost.toFixed(2),
    totalCost: t.totalCost.toFixed(2),
    netPosition: t.netPosition.toFixed(2),
    reservationCount: String(t.reservationCount),
    costPerReservation: t.costPerReservation.toFixed(2),
  }));
}