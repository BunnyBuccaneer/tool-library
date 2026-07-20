import { db } from "@/db";
import {
  users,
  memberProfiles,
  reservations,
  locations,
  tools,
} from "@/db/schema";
import { eq, ilike, and, or, sql, desc, count, type SQL } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MemberListRecord {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  isActive: boolean;
  memberNumber: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  membershipStatus: string;
  joinDate: string;
  expirationDate: string | null;
  preferredLocationId: string | null;
  preferredLocationName: string | null;
  totalReservations: number;
  activeReservations: number;
  createdAt: Date;
}

export interface MemberDetailRecord extends MemberListRecord {
  address: string | null;
  zipCode: string | null;
  notes: string | null;
  updatedAt: Date;
}

export interface MemberReservationRecord {
  id: string;
  toolId: string;
  toolName: string;
  status: string;
  pickupDate: string;
  returnDate: string;
  actualPickupDate: Date | null;
  actualReturnDate: Date | null;
  createdAt: Date;
}

export interface MemberListFilters {
  q?: string;
  status?: string;
  role?: string;
  locationId?: string;
  page?: number;
  pageSize?: number;
}

export interface MemberListResult {
  members: MemberListRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── List all members ─────────────────────────────────────────────────────────

export async function getAllMembers(
  filters: MemberListFilters = {}
): Promise<MemberListResult> {
  const {
    q,
    status,
    role,
    locationId,
    page = 1,
    pageSize = 25,
  } = filters;

  const conditions: SQL[] = [];

  if (q) {
    conditions.push(
      or(
        ilike(users.name, `%${q}%`),
        ilike(users.email, `%${q}%`),
        ilike(memberProfiles.memberNumber, `%${q}%`),
        ilike(memberProfiles.phone, `%${q}%`)
      )!
    );
  }

  if (status) {
    conditions.push(eq(memberProfiles.membershipStatus, status as any));
  }

  if (role) {
    conditions.push(eq(users.role, role as any));
  }

  if (locationId) {
    conditions.push(eq(memberProfiles.preferredLocationId, locationId));
  }

  const whereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  // Count
  const [countResult] = await db
    .select({ value: count() })
    .from(memberProfiles)
    .innerJoin(users, eq(memberProfiles.userId, users.id))
    .leftJoin(
      locations,
      eq(memberProfiles.preferredLocationId, locations.id)
    )
    .where(whereClause);

  const total = countResult?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const offset = (page - 1) * pageSize;

  // Total reservations sub-selects
  const totalResSq = db
    .select({
      userId: reservations.userId,
      total: count().as("total"),
    })
    .from(reservations)
    .groupBy(reservations.userId)
    .as("total_res");

  const activeResSq = db
    .select({
      userId: reservations.userId,
      active: count().as("active"),
    })
    .from(reservations)
    .where(
      or(
        eq(reservations.status, "pending"),
        eq(reservations.status, "confirmed"),
        eq(reservations.status, "checked_out")
      )
    )
    .groupBy(reservations.userId)
    .as("active_res");

  const rows = await db
    .select({
      id: memberProfiles.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      role: users.role,
      isActive: users.isActive,
      memberNumber: memberProfiles.memberNumber,
      phone: memberProfiles.phone,
      city: memberProfiles.city,
      state: memberProfiles.state,
      membershipStatus: memberProfiles.membershipStatus,
      joinDate: memberProfiles.joinDate,
      expirationDate: memberProfiles.expirationDate,
      preferredLocationId: memberProfiles.preferredLocationId,
      preferredLocationName: locations.name,
      totalReservations: totalResSq.total,
      activeReservations: activeResSq.active,
      createdAt: users.createdAt,
    })
    .from(memberProfiles)
    .innerJoin(users, eq(memberProfiles.userId, users.id))
    .leftJoin(
      locations,
      eq(memberProfiles.preferredLocationId, locations.id)
    )
    .leftJoin(totalResSq, eq(users.id, totalResSq.userId))
    .leftJoin(activeResSq, eq(users.id, activeResSq.userId))
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(pageSize)
    .offset(offset);

  const members: MemberListRecord[] = rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    name: r.name,
    email: r.email,
    image: r.image,
    role: r.role,
    isActive: r.isActive,
    memberNumber: r.memberNumber,
    phone: r.phone,
    city: r.city,
    state: r.state,
    membershipStatus: r.membershipStatus,
    joinDate: r.joinDate,
    expirationDate: r.expirationDate,
    preferredLocationId: r.preferredLocationId,
    preferredLocationName: r.preferredLocationName ?? null,
    totalReservations: Number(r.totalReservations ?? 0),
    activeReservations: Number(r.activeReservations ?? 0),
    createdAt: r.createdAt,
  }));

  return { members, total, page, pageSize, totalPages };
}

// ─── Get single member by profile ID ──────────────────────────────────────────

export async function getMemberById(
  profileId: string
): Promise<MemberDetailRecord | null> {
  const totalResSq = db
    .select({
      userId: reservations.userId,
      total: count().as("total"),
    })
    .from(reservations)
    .groupBy(reservations.userId)
    .as("total_res");

  const activeResSq = db
    .select({
      userId: reservations.userId,
      active: count().as("active"),
    })
    .from(reservations)
    .where(
      or(
        eq(reservations.status, "pending"),
        eq(reservations.status, "confirmed"),
        eq(reservations.status, "checked_out")
      )
    )
    .groupBy(reservations.userId)
    .as("active_res");

  const [row] = await db
    .select({
      id: memberProfiles.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      role: users.role,
      isActive: users.isActive,
      memberNumber: memberProfiles.memberNumber,
      phone: memberProfiles.phone,
      address: memberProfiles.address,
      city: memberProfiles.city,
      state: memberProfiles.state,
      zipCode: memberProfiles.zipCode,
      membershipStatus: memberProfiles.membershipStatus,
      joinDate: memberProfiles.joinDate,
      expirationDate: memberProfiles.expirationDate,
      preferredLocationId: memberProfiles.preferredLocationId,
      preferredLocationName: locations.name,
      notes: memberProfiles.notes,
      totalReservations: totalResSq.total,
      activeReservations: activeResSq.active,
      createdAt: users.createdAt,
      updatedAt: memberProfiles.updatedAt,
    })
    .from(memberProfiles)
    .innerJoin(users, eq(memberProfiles.userId, users.id))
    .leftJoin(
      locations,
      eq(memberProfiles.preferredLocationId, locations.id)
    )
    .leftJoin(totalResSq, eq(users.id, totalResSq.userId))
    .leftJoin(activeResSq, eq(users.id, activeResSq.userId))
    .where(eq(memberProfiles.id, profileId))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    email: row.email,
    image: row.image,
    role: row.role,
    isActive: row.isActive,
    memberNumber: row.memberNumber,
    phone: row.phone,
    address: row.address,
    city: row.city,
    state: row.state,
    zipCode: row.zipCode,
    membershipStatus: row.membershipStatus,
    joinDate: row.joinDate,
    expirationDate: row.expirationDate,
    preferredLocationId: row.preferredLocationId,
    preferredLocationName: row.preferredLocationName ?? null,
    notes: row.notes,
    totalReservations: Number(row.totalReservations ?? 0),
    activeReservations: Number(row.activeReservations ?? 0),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ─── Get member by user ID ────────────────────────────────────────────────────

export async function getMemberByUserId(
  userId: string
): Promise<MemberDetailRecord | null> {
  const [profile] = await db
    .select({ id: memberProfiles.id })
    .from(memberProfiles)
    .where(eq(memberProfiles.userId, userId))
    .limit(1);

  if (!profile) return null;
  return getMemberById(profile.id);
}

// ─── Get member reservations ──────────────────────────────────────────────────

export async function getMemberReservations(
  userId: string,
  limit = 20
): Promise<MemberReservationRecord[]> {
  const rows = await db
    .select({
      id: reservations.id,
      toolId: reservations.toolId,
      toolName: tools.name,
      status: reservations.status,
      pickupDate: reservations.pickupDate,
      returnDate: reservations.returnDate,
      actualPickupDate: reservations.actualPickupDate,
      actualReturnDate: reservations.actualReturnDate,
      createdAt: reservations.createdAt,
    })
    .from(reservations)
    .innerJoin(tools, eq(reservations.toolId, tools.id))
    .where(eq(reservations.userId, userId))
    .orderBy(desc(reservations.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    toolId: r.toolId,
    toolName: r.toolName,
    status: r.status,
    pickupDate: r.pickupDate,
    returnDate: r.returnDate,
    actualPickupDate: r.actualPickupDate,
    actualReturnDate: r.actualReturnDate,
    createdAt: r.createdAt,
  }));
}

// ─── Get all locations for filter dropdown ────────────────────────────────────

export async function getMemberFilterLocations(): Promise<
  { id: string; name: string }[]
> {
  return db
    .select({ id: locations.id, name: locations.name })
    .from(locations)
    .where(eq(locations.status, "active"))
    .orderBy(locations.name);
}

// ─── Member stats ─────────────────────────────────────────────────────────────

export interface MemberStats {
  totalMembers: number;
  activeMembers: number;
  suspendedMembers: number;
  expiredMembers: number;
  pendingMembers: number;
}

export async function getMemberStats(): Promise<MemberStats> {
  const rows = await db
    .select({
      status: memberProfiles.membershipStatus,
      count: count(),
    })
    .from(memberProfiles)
    .groupBy(memberProfiles.membershipStatus);

  const map: Record<string, number> = {};
  let totalMembers = 0;
  for (const r of rows) {
    map[r.status] = Number(r.count);
    totalMembers += Number(r.count);
  }

  return {
    totalMembers,
    activeMembers: map["active"] ?? 0,
    suspendedMembers: map["suspended"] ?? 0,
    expiredMembers: map["expired"] ?? 0,
    pendingMembers: map["pending"] ?? 0,
  };
}