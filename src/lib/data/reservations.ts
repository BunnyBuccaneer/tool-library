import { db } from "@/db";
import {
  reservations,
  tools,
  users,
  locations,
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
  gte,
  lte,
  ne,
  type SQL,
} from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReservationListRecord {
  id: string;
  toolId: string;
  toolName: string;
  toolAssetId: string | null;
  userId: string;
  userName: string | null;
  userEmail: string;
  locationId: string | null;
  locationName: string | null;
  status: string;
  pickupDate: string;
  pickupTime: string | null;
  returnDate: string;
  returnTime: string | null;
  actualPickupDate: Date | null;
  actualReturnDate: Date | null;
  notes: string | null;
  createdAt: Date;
}

export interface ReservationDetailRecord extends ReservationListRecord {
  memberNumber: string | null;
  memberPhone: string | null;
  toolBrand: string | null;
  toolModel: string | null;
  toolImageUrl: string | null;
  toolStatus: string;
  updatedAt: Date;
}

export interface ReservationListFilters {
  q?: string;
  status?: string;
  locationId?: string;
  toolId?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface ReservationListResult {
  reservations: ReservationListRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ReservationStats {
  total: number;
  pending: number;
  confirmed: number;
  checkedOut: number;
  returned: number;
  cancelled: number;
  overdue: number;
}

export interface CalendarEvent {
  id: string;
  toolName: string;
  userName: string | null;
  status: string;
  pickupDate: string;
  returnDate: string;
  locationName: string | null;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflicts: {
    id: string;
    userName: string | null;
    userEmail: string;
    status: string;
    pickupDate: string;
    returnDate: string;
  }[];
}

// ─── Get all reservations ─────────────────────────────────────────────────────

export async function getReservationsList(
  filters: ReservationListFilters = {}
): Promise<ReservationListResult> {
  const {
    q,
    status,
    locationId,
    toolId,
    userId,
    dateFrom,
    dateTo,
    page = 1,
    pageSize = 25,
  } = filters;

  const conditions: SQL[] = [];

  if (q) {
    conditions.push(
      or(
        ilike(tools.name, `%${q}%`),
        ilike(users.name, `%${q}%`),
        ilike(users.email, `%${q}%`),
        ilike(tools.assetId, `%${q}%`)
      )!
    );
  }

  if (status) {
    conditions.push(eq(reservations.status, status as any));
  }

  if (locationId) {
    conditions.push(eq(reservations.locationId, locationId));
  }

  if (toolId) {
    conditions.push(eq(reservations.toolId, toolId));
  }

  if (userId) {
    conditions.push(eq(reservations.userId, userId));
  }

  if (dateFrom) {
    conditions.push(sql`${reservations.pickupDate} >= ${dateFrom}`);
  }

  if (dateTo) {
    conditions.push(sql`${reservations.returnDate} <= ${dateTo}`);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ value: count() })
    .from(reservations)
    .innerJoin(tools, eq(reservations.toolId, tools.id))
    .innerJoin(users, eq(reservations.userId, users.id))
    .leftJoin(locations, eq(reservations.locationId, locations.id))
    .where(whereClause);

  const total = countResult?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const offset = (page - 1) * pageSize;

  const rows = await db
    .select({
      id: reservations.id,
      toolId: reservations.toolId,
      toolName: tools.name,
      toolAssetId: tools.assetId,
      userId: reservations.userId,
      userName: users.name,
      userEmail: users.email,
      locationId: reservations.locationId,
      locationName: locations.name,
      status: reservations.status,
      pickupDate: reservations.pickupDate,
      pickupTime: reservations.pickupTime,
      returnDate: reservations.returnDate,
      returnTime: reservations.returnTime,
      actualPickupDate: reservations.actualPickupDate,
      actualReturnDate: reservations.actualReturnDate,
      notes: reservations.notes,
      createdAt: reservations.createdAt,
    })
    .from(reservations)
    .innerJoin(tools, eq(reservations.toolId, tools.id))
    .innerJoin(users, eq(reservations.userId, users.id))
    .leftJoin(locations, eq(reservations.locationId, locations.id))
    .where(whereClause)
    .orderBy(desc(reservations.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    reservations: rows.map((r) => ({
      id: r.id,
      toolId: r.toolId,
      toolName: r.toolName,
      toolAssetId: r.toolAssetId,
      userId: r.userId,
      userName: r.userName,
      userEmail: r.userEmail,
      locationId: r.locationId,
      locationName: r.locationName ?? null,
      status: r.status,
      pickupDate: r.pickupDate,
      pickupTime: r.pickupTime,
      returnDate: r.returnDate,
      returnTime: r.returnTime,
      actualPickupDate: r.actualPickupDate,
      actualReturnDate: r.actualReturnDate,
      notes: r.notes,
      createdAt: r.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
}

// ─── Get reservation by ID ───────────────────────────────────────────────────

export async function getReservationById(
  id: string
): Promise<ReservationDetailRecord | null> {
  const [row] = await db
    .select({
      id: reservations.id,
      toolId: reservations.toolId,
      toolName: tools.name,
      toolAssetId: tools.assetId,
      toolBrand: tools.brand,
      toolModel: tools.model,
      toolImageUrl: tools.imageUrl,
      toolStatus: tools.status,
      userId: reservations.userId,
      userName: users.name,
      userEmail: users.email,
      locationId: reservations.locationId,
      locationName: locations.name,
      status: reservations.status,
      pickupDate: reservations.pickupDate,
      pickupTime: reservations.pickupTime,
      returnDate: reservations.returnDate,
      returnTime: reservations.returnTime,
      actualPickupDate: reservations.actualPickupDate,
      actualReturnDate: reservations.actualReturnDate,
      notes: reservations.notes,
      createdAt: reservations.createdAt,
      updatedAt: reservations.updatedAt,
    })
    .from(reservations)
    .innerJoin(tools, eq(reservations.toolId, tools.id))
    .innerJoin(users, eq(reservations.userId, users.id))
    .leftJoin(locations, eq(reservations.locationId, locations.id))
    .where(eq(reservations.id, id))
    .limit(1);

  if (!row) return null;

  // Get member profile info
  const [profile] = await db
    .select({
      memberNumber: memberProfiles.memberNumber,
      phone: memberProfiles.phone,
    })
    .from(memberProfiles)
    .where(eq(memberProfiles.userId, row.userId))
    .limit(1);

  return {
    id: row.id,
    toolId: row.toolId,
    toolName: row.toolName,
    toolAssetId: row.toolAssetId,
    toolBrand: row.toolBrand,
    toolModel: row.toolModel,
    toolImageUrl: row.toolImageUrl,
    toolStatus: row.toolStatus,
    userId: row.userId,
    userName: row.userName,
    userEmail: row.userEmail,
    locationId: row.locationId,
    locationName: row.locationName ?? null,
    status: row.status,
    pickupDate: row.pickupDate,
    pickupTime: row.pickupTime,
    returnDate: row.returnDate,
    returnTime: row.returnTime,
    actualPickupDate: row.actualPickupDate,
    actualReturnDate: row.actualReturnDate,
    notes: row.notes,
    memberNumber: profile?.memberNumber ?? null,
    memberPhone: profile?.phone ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ─── Reservation stats ───────────────────────────────────────────────────────

export async function getReservationStats(): Promise<ReservationStats> {
  const rows = await db
    .select({
      status: reservations.status,
      cnt: count(),
    })
    .from(reservations)
    .groupBy(reservations.status);

  const map: Record<string, number> = {};
  let total = 0;
  for (const r of rows) {
    map[r.status] = Number(r.cnt);
    total += Number(r.cnt);
  }

  return {
    total,
    pending: map["pending"] ?? 0,
    confirmed: map["confirmed"] ?? 0,
    checkedOut: map["checked_out"] ?? 0,
    returned: map["returned"] ?? 0,
    cancelled: map["cancelled"] ?? 0,
    overdue: map["overdue"] ?? 0,
  };
}

// ─── Calendar events (for a date range) ───────────────────────────────────────

export async function getCalendarEvents(
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> {
  const rows = await db
    .select({
      id: reservations.id,
      toolName: tools.name,
      userName: users.name,
      status: reservations.status,
      pickupDate: reservations.pickupDate,
      returnDate: reservations.returnDate,
      locationName: locations.name,
    })
    .from(reservations)
    .innerJoin(tools, eq(reservations.toolId, tools.id))
    .innerJoin(users, eq(reservations.userId, users.id))
    .leftJoin(locations, eq(reservations.locationId, locations.id))
    .where(
      and(
        sql`${reservations.pickupDate} <= ${endDate}`,
        sql`${reservations.returnDate} >= ${startDate}`,
        or(
          eq(reservations.status, "pending"),
          eq(reservations.status, "confirmed"),
          eq(reservations.status, "checked_out"),
          eq(reservations.status, "overdue")
        )
      )
    )
    .orderBy(asc(reservations.pickupDate));

  return rows.map((r) => ({
    id: r.id,
    toolName: r.toolName,
    userName: r.userName,
    status: r.status,
    pickupDate: r.pickupDate,
    returnDate: r.returnDate,
    locationName: r.locationName ?? null,
  }));
}

// ─── Conflict detection ──────────────────────────────────────────────────────

export async function checkReservationConflicts(
  toolId: string,
  pickupDate: string,
  returnDate: string,
  excludeReservationId?: string
): Promise<ConflictResult> {
  const conditions: SQL[] = [
    eq(reservations.toolId, toolId),
    sql`${reservations.pickupDate} <= ${returnDate}`,
    sql`${reservations.returnDate} >= ${pickupDate}`,
    or(
      eq(reservations.status, "pending"),
      eq(reservations.status, "confirmed"),
      eq(reservations.status, "checked_out")
    )!,
  ];

  if (excludeReservationId) {
    conditions.push(ne(reservations.id, excludeReservationId));
  }

  const rows = await db
    .select({
      id: reservations.id,
      userName: users.name,
      userEmail: users.email,
      status: reservations.status,
      pickupDate: reservations.pickupDate,
      returnDate: reservations.returnDate,
    })
    .from(reservations)
    .innerJoin(users, eq(reservations.userId, users.id))
    .where(and(...conditions))
    .orderBy(asc(reservations.pickupDate));

  return {
    hasConflict: rows.length > 0,
    conflicts: rows.map((r) => ({
      id: r.id,
      userName: r.userName,
      userEmail: r.userEmail,
      status: r.status,
      pickupDate: r.pickupDate,
      returnDate: r.returnDate,
    })),
  };
}

// ─── Get locations for filter ─────────────────────────────────────────────────

export async function getReservationFilterLocations(): Promise<
  { id: string; name: string }[]
> {
  return db
    .select({ id: locations.id, name: locations.name })
    .from(locations)
    .where(eq(locations.status, "active"))
    .orderBy(locations.name);
}