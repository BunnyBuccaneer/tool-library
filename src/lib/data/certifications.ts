import { db } from "@/db";
import {
  certificationTypes,
  certificationRequirements,
  memberCertifications,
  categories,
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
  isNull,
  lte,
  type SQL,
} from "drizzle-orm";

// ─── Certification Type list types ────────────────────────────────────────────

export interface CertTypeListRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  validityMonths: number | null;
  isRequired: boolean;
  status: string;
  sortOrder: number;
  requirementCount: number;
  memberCertCount: number;
  createdAt: Date;
}

export interface CertTypeDetailRecord extends CertTypeListRecord {
  updatedAt: Date;
  requirements: CertRequirementRecord[];
}

export interface CertRequirementRecord {
  id: string;
  certificationTypeId: string;
  categoryId: string | null;
  categoryName: string | null;
  toolId: string | null;
  toolName: string | null;
  createdAt: Date;
}

export interface MemberCertListRecord {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  certificationTypeId: string;
  certTypeName: string;
  status: string;
  issuedDate: string | null;
  expiryDate: string | null;
  issuedById: string | null;
  issuedByName: string | null;
  certificateNumber: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface CertTypeFilters {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface CertTypeListResult {
  certTypes: CertTypeListRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MemberCertFilters {
  q?: string;
  status?: string;
  certTypeId?: string;
  expiringWithinDays?: number;
  page?: number;
  pageSize?: number;
}

export interface MemberCertListResult {
  certs: MemberCertListRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CertStats {
  totalCertTypes: number;
  activeCertTypes: number;
  totalMemberCerts: number;
  validMemberCerts: number;
  expiredMemberCerts: number;
  pendingMemberCerts: number;
  expiringIn30Days: number;
}

// ─── Get all cert types ───────────────────────────────────────────────────────

export async function getAllCertTypes(
  filters: CertTypeFilters = {}
): Promise<CertTypeListResult> {
  const { q, status, page = 1, pageSize = 25 } = filters;

  const conditions: SQL[] = [];

  if (q) {
    conditions.push(
      or(
        ilike(certificationTypes.name, `%${q}%`),
        ilike(certificationTypes.description, `%${q}%`)
      )!
    );
  }

  if (status) {
    conditions.push(eq(certificationTypes.status, status as any));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ value: count() })
    .from(certificationTypes)
    .where(whereClause);

  const total = countResult?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const offset = (page - 1) * pageSize;

  // FIX: Give each subquery's count column a UNIQUE alias
  const reqCountSq = db
    .select({
      certTypeId: certificationRequirements.certificationTypeId,
      reqCnt: count().as("req_cnt"),
    })
    .from(certificationRequirements)
    .groupBy(certificationRequirements.certificationTypeId)
    .as("req_count");

  const memberCertCountSq = db
    .select({
      certTypeId: memberCertifications.certificationTypeId,
      memberCnt: count().as("member_cnt"),
    })
    .from(memberCertifications)
    .groupBy(memberCertifications.certificationTypeId)
    .as("member_cert_count");

  const rows = await db
    .select({
      id: certificationTypes.id,
      name: certificationTypes.name,
      slug: certificationTypes.slug,
      description: certificationTypes.description,
      validityMonths: certificationTypes.validityMonths,
      isRequired: certificationTypes.isRequired,
      status: certificationTypes.status,
      sortOrder: certificationTypes.sortOrder,
      requirementCount: reqCountSq.reqCnt,
      memberCertCount: memberCertCountSq.memberCnt,
      createdAt: certificationTypes.createdAt,
    })
    .from(certificationTypes)
    .leftJoin(reqCountSq, eq(certificationTypes.id, reqCountSq.certTypeId))
    .leftJoin(
      memberCertCountSq,
      eq(certificationTypes.id, memberCertCountSq.certTypeId)
    )
    .where(whereClause)
    .orderBy(asc(certificationTypes.sortOrder), asc(certificationTypes.name))
    .limit(pageSize)
    .offset(offset);

  const certTypes: CertTypeListRecord[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    validityMonths: r.validityMonths,
    isRequired: r.isRequired,
    status: r.status,
    sortOrder: r.sortOrder,
    requirementCount: Number(r.requirementCount ?? 0),
    memberCertCount: Number(r.memberCertCount ?? 0),
    createdAt: r.createdAt,
  }));

  return { certTypes, total, page, pageSize, totalPages };
}

// ─── Get cert type by ID with requirements ────────────────────────────────────

export async function getCertTypeById(
  id: string
): Promise<CertTypeDetailRecord | null> {
  const [row] = await db
    .select()
    .from(certificationTypes)
    .where(eq(certificationTypes.id, id))
    .limit(1);

  if (!row) return null;

  // FIX: Unique aliases here too
  const reqCountSq = db
    .select({
      certTypeId: certificationRequirements.certificationTypeId,
      reqCnt: count().as("req_cnt_detail"),
    })
    .from(certificationRequirements)
    .where(eq(certificationRequirements.certificationTypeId, id))
    .groupBy(certificationRequirements.certificationTypeId)
    .as("req_count_detail");

  const memberCertCountSq = db
    .select({
      certTypeId: memberCertifications.certificationTypeId,
      memberCnt: count().as("member_cnt_detail"),
    })
    .from(memberCertifications)
    .where(eq(memberCertifications.certificationTypeId, id))
    .groupBy(memberCertifications.certificationTypeId)
    .as("member_cert_count_detail");

  const [countRow] = await db
    .select({
      reqCount: reqCountSq.reqCnt,
      memberCount: memberCertCountSq.memberCnt,
    })
    .from(certificationTypes)
    .leftJoin(reqCountSq, eq(certificationTypes.id, reqCountSq.certTypeId))
    .leftJoin(
      memberCertCountSq,
      eq(certificationTypes.id, memberCertCountSq.certTypeId)
    )
    .where(eq(certificationTypes.id, id))
    .limit(1);

  const requirements = await getCertRequirements(id);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    validityMonths: row.validityMonths,
    isRequired: row.isRequired,
    status: row.status,
    sortOrder: row.sortOrder,
    requirementCount: Number(countRow?.reqCount ?? 0),
    memberCertCount: Number(countRow?.memberCount ?? 0),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    requirements,
  };
}

// ─── Get requirements for a cert type ─────────────────────────────────────────

export async function getCertRequirements(
  certTypeId: string
): Promise<CertRequirementRecord[]> {
  const rows = await db
    .select({
      id: certificationRequirements.id,
      certificationTypeId: certificationRequirements.certificationTypeId,
      categoryId: certificationRequirements.categoryId,
      categoryName: categories.name,
      toolId: certificationRequirements.toolId,
      toolName: tools.name,
      createdAt: certificationRequirements.createdAt,
    })
    .from(certificationRequirements)
    .leftJoin(
      categories,
      eq(certificationRequirements.categoryId, categories.id)
    )
    .leftJoin(tools, eq(certificationRequirements.toolId, tools.id))
    .where(eq(certificationRequirements.certificationTypeId, certTypeId))
    .orderBy(asc(certificationRequirements.createdAt));

  return rows.map((r) => ({
    id: r.id,
    certificationTypeId: r.certificationTypeId,
    categoryId: r.categoryId,
    categoryName: r.categoryName ?? null,
    toolId: r.toolId,
    toolName: r.toolName ?? null,
    createdAt: r.createdAt,
  }));
}

// ─── Get all member certifications ────────────────────────────────────────────

const issuedByUsers = db
  .select({
    id: users.id,
    name: users.name,
  })
  .from(users)
  .as("issued_by_users");

export async function getAllMemberCerts(
  filters: MemberCertFilters = {}
): Promise<MemberCertListResult> {
  const { q, status, certTypeId, expiringWithinDays, page = 1, pageSize = 25 } = filters;

  const conditions: SQL[] = [];

  if (q) {
    conditions.push(
      or(
        ilike(users.name, `%${q}%`),
        ilike(users.email, `%${q}%`),
        ilike(certificationTypes.name, `%${q}%`),
        ilike(memberCertifications.certificateNumber, `%${q}%`)
      )!
    );
  }

  if (status) {
    conditions.push(eq(memberCertifications.status, status as any));
  }

  if (certTypeId) {
    conditions.push(
      eq(memberCertifications.certificationTypeId, certTypeId)
    );
  }

  if (expiringWithinDays && expiringWithinDays > 0) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + expiringWithinDays);
    const futureDateStr = futureDate.toISOString().split("T")[0];
    const todayStr = new Date().toISOString().split("T")[0];
    conditions.push(
      and(
        eq(memberCertifications.status, "valid"),
        sql`${memberCertifications.expiryDate} IS NOT NULL`,
        sql`${memberCertifications.expiryDate} <= ${futureDateStr}`,
        sql`${memberCertifications.expiryDate} >= ${todayStr}`
      )!
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ value: count() })
    .from(memberCertifications)
    .innerJoin(users, eq(memberCertifications.userId, users.id))
    .innerJoin(
      certificationTypes,
      eq(memberCertifications.certificationTypeId, certificationTypes.id)
    )
    .where(whereClause);

  const total = countResult?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const offset = (page - 1) * pageSize;

  const rows = await db
    .select({
      id: memberCertifications.id,
      userId: memberCertifications.userId,
      userName: users.name,
      userEmail: users.email,
      certificationTypeId: memberCertifications.certificationTypeId,
      certTypeName: certificationTypes.name,
      status: memberCertifications.status,
      issuedDate: memberCertifications.issuedDate,
      expiryDate: memberCertifications.expiryDate,
      issuedById: memberCertifications.issuedById,
      certificateNumber: memberCertifications.certificateNumber,
      notes: memberCertifications.notes,
      createdAt: memberCertifications.createdAt,
    })
    .from(memberCertifications)
    .innerJoin(users, eq(memberCertifications.userId, users.id))
    .innerJoin(
      certificationTypes,
      eq(memberCertifications.certificationTypeId, certificationTypes.id)
    )
    .where(whereClause)
    .orderBy(desc(memberCertifications.createdAt))
    .limit(pageSize)
    .offset(offset);

  // Fetch issued-by names separately
  const issuedByIds = rows
    .map((r) => r.issuedById)
    .filter((id): id is string => id !== null);

  let issuedByMap: Record<string, string | null> = {};
  if (issuedByIds.length > 0) {
    const issuedByRows = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(
        or(...issuedByIds.map((uid) => eq(users.id, uid)))!
      );
    for (const r of issuedByRows) {
      issuedByMap[r.id] = r.name;
    }
  }

  const certs: MemberCertListRecord[] = rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    userName: r.userName,
    userEmail: r.userEmail,
    certificationTypeId: r.certificationTypeId,
    certTypeName: r.certTypeName,
    status: r.status,
    issuedDate: r.issuedDate,
    expiryDate: r.expiryDate,
    issuedById: r.issuedById,
    issuedByName: r.issuedById ? (issuedByMap[r.issuedById] ?? null) : null,
    certificateNumber: r.certificateNumber,
    notes: r.notes,
    createdAt: r.createdAt,
  }));

  return { certs, total, page, pageSize, totalPages };
}

// ─── Get member certs for a specific user ─────────────────────────────────────

export async function getMemberCertsForUser(
  userId: string
): Promise<MemberCertListRecord[]> {
  const rows = await db
    .select({
      id: memberCertifications.id,
      userId: memberCertifications.userId,
      userName: users.name,
      userEmail: users.email,
      certificationTypeId: memberCertifications.certificationTypeId,
      certTypeName: certificationTypes.name,
      status: memberCertifications.status,
      issuedDate: memberCertifications.issuedDate,
      expiryDate: memberCertifications.expiryDate,
      issuedById: memberCertifications.issuedById,
      certificateNumber: memberCertifications.certificateNumber,
      notes: memberCertifications.notes,
      createdAt: memberCertifications.createdAt,
    })
    .from(memberCertifications)
    .innerJoin(users, eq(memberCertifications.userId, users.id))
    .innerJoin(
      certificationTypes,
      eq(memberCertifications.certificationTypeId, certificationTypes.id)
    )
    .where(eq(memberCertifications.userId, userId))
    .orderBy(desc(memberCertifications.createdAt));

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    userName: r.userName,
    userEmail: r.userEmail,
    certificationTypeId: r.certificationTypeId,
    certTypeName: r.certTypeName,
    status: r.status,
    issuedDate: r.issuedDate,
    expiryDate: r.expiryDate,
    issuedById: r.issuedById,
    issuedByName: null,
    certificateNumber: r.certificateNumber,
    notes: r.notes,
    createdAt: r.createdAt,
  }));
}

// ─── Cert stats ───────────────────────────────────────────────────────────────

export async function getCertStats(): Promise<CertStats> {
  const [typeStats] = await db
    .select({
      total: count(),
      active: sql<number>`count(*) filter (where ${certificationTypes.status} = 'active')`,
    })
    .from(certificationTypes);

  const memberStats = await db
    .select({
      status: memberCertifications.status,
      cnt: count(),
    })
    .from(memberCertifications)
    .groupBy(memberCertifications.status);

  const statusMap: Record<string, number> = {};
  let totalMemberCerts = 0;
  for (const r of memberStats) {
    statusMap[r.status] = Number(r.cnt);
    totalMemberCerts += Number(r.cnt);
  }

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  const futureDateStr = futureDate.toISOString().split("T")[0];
  const todayStr = new Date().toISOString().split("T")[0];

  const [expiringResult] = await db
    .select({ cnt: count() })
    .from(memberCertifications)
    .where(
      and(
        eq(memberCertifications.status, "valid"),
        sql`${memberCertifications.expiryDate} IS NOT NULL`,
        sql`${memberCertifications.expiryDate} <= ${futureDateStr}`,
        sql`${memberCertifications.expiryDate} >= ${todayStr}`
      )
    );

  return {
    totalCertTypes: Number(typeStats?.total ?? 0),
    activeCertTypes: Number(typeStats?.active ?? 0),
    totalMemberCerts,
    validMemberCerts: statusMap["valid"] ?? 0,
    expiredMemberCerts: statusMap["expired"] ?? 0,
    pendingMemberCerts: statusMap["pending"] ?? 0,
    expiringIn30Days: Number(expiringResult?.cnt ?? 0),
  };
}

// ─── Dropdown helpers ─────────────────────────────────────────────────────────

export async function getActiveCertTypesForDropdown(): Promise<
  { id: string; name: string }[]
> {
  return db
    .select({ id: certificationTypes.id, name: certificationTypes.name })
    .from(certificationTypes)
    .where(eq(certificationTypes.status, "active"))
    .orderBy(asc(certificationTypes.name));
}

export async function getCategoriesForDropdown(): Promise<
  { id: string; name: string }[]
> {
  return db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.status, "active"))
    .orderBy(asc(categories.name));
}

export async function getToolsForDropdown(): Promise<
  { id: string; name: string }[]
> {
  return db
    .select({ id: tools.id, name: tools.name })
    .from(tools)
    .where(eq(tools.isActive, true))
    .orderBy(asc(tools.name));
}

export async function getMembersForDropdown(): Promise<
  { id: string; name: string; email: string }[]
> {
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.isActive, true))
    .orderBy(asc(users.name));

  return rows.map((r) => ({
    id: r.id,
    name: r.name ?? "",
    email: r.email,
  }));
}