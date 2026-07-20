import { db } from "@/db";
import {
  partners,
  partnerContacts,
  partnerToolLinks,
  partnerRepairLinks,
  tools,
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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PartnerListRecord {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  description: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  contactCount: number;
  toolLinkCount: number;
  repairLinkCount: number;
  createdAt: Date;
}

export interface PartnerDetailRecord extends PartnerListRecord {
  address: string | null;
  zipCode: string | null;
  notes: string | null;
  updatedAt: Date;
  contacts: PartnerContactRecord[];
  toolLinks: PartnerToolLinkRecord[];
  repairLinks: PartnerRepairLinkRecord[];
}

export interface PartnerContactRecord {
  id: string;
  partnerId: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
  notes: string | null;
  createdAt: Date;
}

export interface PartnerToolLinkRecord {
  id: string;
  partnerId: string;
  toolId: string;
  toolName: string;
  toolAssetId: string | null;
  relationship: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface PartnerRepairLinkRecord {
  id: string;
  partnerId: string;
  repairId: string;
  repairTitle: string;
  repairStatus: string;
  role: string | null;
  cost: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface PartnerFilters {
  q?: string;
  type?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface PartnerListResult {
  partners: PartnerListRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PartnerStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  suppliers: number;
  vendors: number;
  sponsors: number;
}

// ─── Get all partners ─────────────────────────────────────────────────────────

export async function getAllPartners(
  filters: PartnerFilters = {}
): Promise<PartnerListResult> {
  const { q, type, status, page = 1, pageSize = 25 } = filters;

  const conditions: SQL[] = [];

  if (q) {
    conditions.push(
      or(
        ilike(partners.name, `%${q}%`),
        ilike(partners.email, `%${q}%`),
        ilike(partners.phone, `%${q}%`),
        ilike(partners.city, `%${q}%`)
      )!
    );
  }

  if (type) {
    conditions.push(eq(partners.type, type as any));
  }

  if (status) {
    conditions.push(eq(partners.status, status as any));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ value: count() })
    .from(partners)
    .where(whereClause);

  const total = Number(countResult?.value ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const offset = (page - 1) * pageSize;

  const contactCountSq = db
    .select({
      partnerId: partnerContacts.partnerId,
      cnt: count().as("contact_cnt"), // ← unique
    })
    .from(partnerContacts)
    .groupBy(partnerContacts.partnerId)
    .as("contact_count");

  const toolLinkCountSq = db
    .select({
      partnerId: partnerToolLinks.partnerId,
      cnt: count().as("tool_link_cnt"), // ← unique
    })
    .from(partnerToolLinks)
    .groupBy(partnerToolLinks.partnerId)
    .as("tool_link_count");

  const repairLinkCountSq = db
    .select({
      partnerId: partnerRepairLinks.partnerId,
      cnt: count().as("repair_link_cnt"), // ← unique
    })
    .from(partnerRepairLinks)
    .groupBy(partnerRepairLinks.partnerId)
    .as("repair_link_count");

  const rows = await db
    .select({
      id: partners.id,
      name: partners.name,
      slug: partners.slug,
      type: partners.type,
      status: partners.status,
      description: partners.description,
      website: partners.website,
      email: partners.email,
      phone: partners.phone,
      city: partners.city,
      state: partners.state,
      contactCount: contactCountSq.cnt,
      toolLinkCount: toolLinkCountSq.cnt,
      repairLinkCount: repairLinkCountSq.cnt,
      createdAt: partners.createdAt,
    })
    .from(partners)
    .leftJoin(contactCountSq, eq(partners.id, contactCountSq.partnerId))
    .leftJoin(toolLinkCountSq, eq(partners.id, toolLinkCountSq.partnerId))
    .leftJoin(repairLinkCountSq, eq(partners.id, repairLinkCountSq.partnerId))
    .where(whereClause)
    .orderBy(asc(partners.name))
    .limit(pageSize)
    .offset(offset);

  return {
    partners: rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      type: r.type,
      status: r.status,
      description: r.description,
      website: r.website,
      email: r.email,
      phone: r.phone,
      city: r.city,
      state: r.state,
      contactCount: Number(r.contactCount ?? 0),
      toolLinkCount: Number(r.toolLinkCount ?? 0),
      repairLinkCount: Number(r.repairLinkCount ?? 0),
      createdAt: r.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}

// ─── Get partner by ID ────────────────────────────────────────────────────────

export async function getPartnerById(
  id: string
): Promise<PartnerDetailRecord | null> {
  const [row] = await db
    .select()
    .from(partners)
    .where(eq(partners.id, id))
    .limit(1);

  if (!row) return null;

  const contacts = await db
    .select()
    .from(partnerContacts)
    .where(eq(partnerContacts.partnerId, id))
    .orderBy(desc(partnerContacts.isPrimary), asc(partnerContacts.name));

  const toolLinkRows = await db
    .select({
      id: partnerToolLinks.id,
      partnerId: partnerToolLinks.partnerId,
      toolId: partnerToolLinks.toolId,
      toolName: tools.name,
      toolAssetId: tools.assetId,
      relationship: partnerToolLinks.relationship,
      notes: partnerToolLinks.notes,
      createdAt: partnerToolLinks.createdAt,
    })
    .from(partnerToolLinks)
    .innerJoin(tools, eq(partnerToolLinks.toolId, tools.id))
    .where(eq(partnerToolLinks.partnerId, id))
    .orderBy(asc(tools.name));

  const repairLinkRows = await db
    .select({
      id: partnerRepairLinks.id,
      partnerId: partnerRepairLinks.partnerId,
      repairId: partnerRepairLinks.repairId,
      repairTitle: repairs.title,
      repairStatus: repairs.status,
      role: partnerRepairLinks.role,
      cost: partnerRepairLinks.cost,
      notes: partnerRepairLinks.notes,
      createdAt: partnerRepairLinks.createdAt,
    })
    .from(partnerRepairLinks)
    .innerJoin(repairs, eq(partnerRepairLinks.repairId, repairs.id))
    .where(eq(partnerRepairLinks.partnerId, id))
    .orderBy(desc(partnerRepairLinks.createdAt));

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    type: row.type,
    status: row.status,
    description: row.description,
    website: row.website,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    state: row.state,
    zipCode: row.zipCode,
    notes: row.notes,
    contactCount: contacts.length,
    toolLinkCount: toolLinkRows.length,
    repairLinkCount: repairLinkRows.length,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    contacts: contacts.map((c) => ({
      id: c.id,
      partnerId: c.partnerId,
      name: c.name,
      title: c.title,
      email: c.email,
      phone: c.phone,
      isPrimary: c.isPrimary,
      notes: c.notes,
      createdAt: c.createdAt,
    })),
    toolLinks: toolLinkRows.map((t) => ({
      id: t.id,
      partnerId: t.partnerId,
      toolId: t.toolId,
      toolName: t.toolName,
      toolAssetId: t.toolAssetId,
      relationship: t.relationship,
      notes: t.notes,
      createdAt: t.createdAt,
    })),
    repairLinks: repairLinkRows.map((r) => ({
      id: r.id,
      partnerId: r.partnerId,
      repairId: r.repairId,
      repairTitle: r.repairTitle,
      repairStatus: r.repairStatus,
      role: r.role,
      cost: r.cost,
      notes: r.notes,
      createdAt: r.createdAt,
    })),
  };
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getPartnerStats(): Promise<PartnerStats> {
  const statusRows = await db
    .select({ status: partners.status, cnt: count() })
    .from(partners)
    .groupBy(partners.status);

  const typeRows = await db
    .select({ type: partners.type, cnt: count() })
    .from(partners)
    .groupBy(partners.type);

  const statusMap: Record<string, number> = {};
  let total = 0;
  for (const r of statusRows) {
    statusMap[r.status] = Number(r.cnt);
    total += Number(r.cnt);
  }

  const typeMap: Record<string, number> = {};
  for (const r of typeRows) {
    typeMap[r.type] = Number(r.cnt);
  }

  return {
    total,
    active: statusMap["active"] ?? 0,
    inactive: statusMap["inactive"] ?? 0,
    pending: statusMap["pending"] ?? 0,
    suppliers: typeMap["supplier"] ?? 0,
    vendors: typeMap["vendor"] ?? 0,
    sponsors: typeMap["sponsor"] ?? 0,
  };
}

// ─── Dropdowns ────────────────────────────────────────────────────────────────

export async function getToolsForPartnerDropdown(): Promise<
  { id: string; name: string; assetId: string | null }[]
> {
  return db
    .select({ id: tools.id, name: tools.name, assetId: tools.assetId })
    .from(tools)
    .where(eq(tools.isActive, true))
    .orderBy(asc(tools.name));
}

export async function getRepairsForPartnerDropdown(): Promise<
  { id: string; title: string; status: string }[]
> {
  return db
    .select({ id: repairs.id, title: repairs.title, status: repairs.status })
    .from(repairs)
    .orderBy(desc(repairs.createdAt))
    .limit(100);
}