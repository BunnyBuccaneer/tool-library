import { db } from "@/db";
import {
  users,
  tools,
  reservations,
  locations,
  notifications,
  memberProfiles,
  categories,
  toolImages,
  toolAccessories,
  toolMaintenanceRecords,
} from "@/db/schema";
import { eq, sql, and, or, count, desc, asc } from "drizzle-orm";

// ══════════════════════════════════════════════════════════════════════
// Dashboard Queries
// ══════════════════════════════════════════════════════════════════════

// ── Dashboard KPIs ─────────────────────────────────────────────────────

export interface DashboardKPIs {
  totalTools: number;
  totalMembers: number;
  activeReservations: number;
  totalLocations: number;
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const [toolCount] = await db
    .select({ count: count() })
    .from(tools)
    .where(eq(tools.isActive, true));

  const [memberCount] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.role, "member"));

  const [reservationCount] = await db
    .select({ count: count() })
    .from(reservations)
    .where(
      or(
        eq(reservations.status, "pending"),
        eq(reservations.status, "confirmed"),
        eq(reservations.status, "checked_out")
      )
    );

  const [locationCount] = await db
    .select({ count: count() })
    .from(locations)
    .where(eq(locations.status, "active"));

  return {
    totalTools: toolCount?.count ?? 0,
    totalMembers: memberCount?.count ?? 0,
    activeReservations: reservationCount?.count ?? 0,
    totalLocations: locationCount?.count ?? 0,
  };
}

// ── Current Rentals (checked_out status) ───────────────────────────────

export interface CurrentRental {
  id: string;
  toolId: string;
  toolName: string;
  toolSlug: string;
  memberId: string;
  memberName: string | null;
  memberEmail: string;
  pickupDate: string;
  returnDate: string;
  status: string;
  locationName: string | null;
}

export async function getCurrentRentals(limit = 10): Promise<CurrentRental[]> {
  const rentals = await db
    .select({
      id: reservations.id,
      toolId: tools.id,
      toolName: tools.name,
      toolSlug: tools.slug,
      memberId: users.id,
      memberName: users.name,
      memberEmail: users.email,
      pickupDate: reservations.pickupDate,
      returnDate: reservations.returnDate,
      status: reservations.status,
      locationName: locations.name,
    })
    .from(reservations)
    .innerJoin(tools, eq(reservations.toolId, tools.id))
    .innerJoin(users, eq(reservations.userId, users.id))
    .leftJoin(locations, eq(reservations.locationId, locations.id))
    .where(eq(reservations.status, "checked_out"))
    .orderBy(desc(reservations.pickupDate))
    .limit(limit);

  return rentals;
}

// ── Overdue Tools ──────────────────────────────────────────────────────

export interface OverdueTool {
  id: string;
  toolId: string;
  toolName: string;
  toolSlug: string;
  memberId: string;
  memberName: string | null;
  memberEmail: string;
  returnDate: string;
  daysOverdue: number;
  locationName: string | null;
}

export async function getOverdueTools(limit = 50): Promise<OverdueTool[]> {
  const today = new Date().toISOString().split("T")[0];

  const overdueReservations = await db
    .select({
      id: reservations.id,
      toolId: tools.id,
      toolName: tools.name,
      toolSlug: tools.slug,
      memberId: users.id,
      memberName: users.name,
      memberEmail: users.email,
      returnDate: reservations.returnDate,
      locationName: locations.name,
    })
    .from(reservations)
    .innerJoin(tools, eq(reservations.toolId, tools.id))
    .innerJoin(users, eq(reservations.userId, users.id))
    .leftJoin(locations, eq(reservations.locationId, locations.id))
    .where(
      or(
        eq(reservations.status, "overdue"),
        and(
          eq(reservations.status, "checked_out"),
          sql`${reservations.returnDate} < ${today}`
        )
      )
    )
    .orderBy(reservations.returnDate)
    .limit(limit);

  const todayObj = new Date(today);

  return overdueReservations.map((r) => {
    const returnDateObj = new Date(r.returnDate);
    const diffTime = todayObj.getTime() - returnDateObj.getTime();
    const daysOverdue = Math.max(
      0,
      Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    );

    return { ...r, daysOverdue };
  });
}

// ── Today's Returns ────────────────────────────────────────────────────

export interface TodaysReturn {
  id: string;
  toolId: string;
  toolName: string;
  memberId: string;
  memberName: string | null;
  memberEmail: string;
  returnTime: string | null;
  status: string;
  locationName: string | null;
}

export async function getTodaysReturns(): Promise<TodaysReturn[]> {
  const today = new Date().toISOString().split("T")[0];

  const todaysReturns = await db
    .select({
      id: reservations.id,
      toolId: tools.id,
      toolName: tools.name,
      memberId: users.id,
      memberName: users.name,
      memberEmail: users.email,
      returnTime: reservations.returnTime,
      status: reservations.status,
      locationName: locations.name,
    })
    .from(reservations)
    .innerJoin(tools, eq(reservations.toolId, tools.id))
    .innerJoin(users, eq(reservations.userId, users.id))
    .leftJoin(locations, eq(reservations.locationId, locations.id))
    .where(
      and(
        sql`${reservations.returnDate} = ${today}`,
        or(
          eq(reservations.status, "checked_out"),
          eq(reservations.status, "confirmed")
        )
      )
    )
    .orderBy(reservations.returnTime);

  return todaysReturns;
}

// ── Tools in Maintenance ───────────────────────────────────────────────

export interface MaintenanceTool {
  id: string;
  name: string;
  slug: string;
  assetId: string | null;
  brand: string | null;
  model: string | null;
  locationName: string | null;
  categoryName: string | null;
  conditionNotes: string | null;
  status: string;
  updatedAt: Date;
}

export async function getMaintenanceTools(
  limit = 50
): Promise<MaintenanceTool[]> {
  const maintenanceTools = await db
    .select({
      id: tools.id,
      name: tools.name,
      slug: tools.slug,
      assetId: tools.assetId,
      brand: tools.brand,
      model: tools.model,
      locationName: locations.name,
      categoryName: categories.name,
      conditionNotes: tools.conditionNotes,
      status: tools.status,
      updatedAt: tools.updatedAt,
    })
    .from(tools)
    .leftJoin(locations, eq(tools.locationId, locations.id))
    .leftJoin(categories, eq(tools.categoryId, categories.id))
    .where(or(eq(tools.status, "maintenance"), eq(tools.status, "retired")))
    .orderBy(desc(tools.updatedAt))
    .limit(limit);

  return maintenanceTools;
}

// ── Upcoming Reservations ──────────────────────────────────────────────

export interface UpcomingReservation {
  id: string;
  toolId: string;
  toolName: string;
  memberId: string;
  memberName: string | null;
  memberEmail: string;
  pickupDate: string;
  pickupTime: string | null;
  returnDate: string;
  status: string;
  locationName: string | null;
}

export async function getUpcomingReservations(
  limit = 10
): Promise<UpcomingReservation[]> {
  const today = new Date().toISOString().split("T")[0];

  const upcoming = await db
    .select({
      id: reservations.id,
      toolId: tools.id,
      toolName: tools.name,
      memberId: users.id,
      memberName: users.name,
      memberEmail: users.email,
      pickupDate: reservations.pickupDate,
      pickupTime: reservations.pickupTime,
      returnDate: reservations.returnDate,
      status: reservations.status,
      locationName: locations.name,
    })
    .from(reservations)
    .innerJoin(tools, eq(reservations.toolId, tools.id))
    .innerJoin(users, eq(reservations.userId, users.id))
    .leftJoin(locations, eq(reservations.locationId, locations.id))
    .where(
      and(
        sql`${reservations.pickupDate} >= ${today}`,
        or(
          eq(reservations.status, "pending"),
          eq(reservations.status, "confirmed")
        )
      )
    )
    .orderBy(reservations.pickupDate)
    .limit(limit);

  return upcoming;
}

// ── Recent Notifications ───────────────────────────────────────────────

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
  userName: string | null;
}

export async function getRecentNotifications(
  limit = 10
): Promise<AdminNotification[]> {
  const recentNotifications = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      title: notifications.title,
      message: notifications.message,
      createdAt: notifications.createdAt,
      isRead: notifications.isRead,
      userName: users.name,
    })
    .from(notifications)
    .innerJoin(users, eq(notifications.userId, users.id))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return recentNotifications;
}

// ── Tool Status Summary ────────────────────────────────────────────────

export interface ToolStatusSummary {
  available: number;
  checkedOut: number;
  reserved: number;
  maintenance: number;
  retired: number;
}

export async function getToolStatusSummary(): Promise<ToolStatusSummary> {
  const statusCounts = await db
    .select({
      status: tools.status,
      count: count(),
    })
    .from(tools)
    .where(eq(tools.isActive, true))
    .groupBy(tools.status);

  const summary: ToolStatusSummary = {
    available: 0,
    checkedOut: 0,
    reserved: 0,
    maintenance: 0,
    retired: 0,
  };

  for (const row of statusCounts) {
    switch (row.status) {
      case "available":
        summary.available = row.count;
        break;
      case "checked_out":
        summary.checkedOut = row.count;
        break;
      case "reserved":
        summary.reserved = row.count;
        break;
      case "maintenance":
        summary.maintenance = row.count;
        break;
      case "retired":
        summary.retired = row.count;
        break;
    }
  }

  return summary;
}

// ── Recent Members ─────────────────────────────────────────────────────

export interface RecentMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
  isActive: boolean;
}

export async function getRecentMembers(limit = 5): Promise<RecentMember[]> {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      isActive: users.isActive,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit);
}

// ══════════════════════════════════════════════════════════════════════
// Extended Queries — Admin Pages
// ══════════════════════════════════════════════════════════════════════

// ── All Rentals (with filters) ─────────────────────────────────────────

export interface RentalFilters {
  status?: string;
  search?: string;
  limit?: number;
}

export interface RentalRecord {
  id: string;
  toolId: string;
  toolName: string;
  toolSlug: string;
  memberId: string;
  memberName: string | null;
  memberEmail: string;
  pickupDate: string;
  returnDate: string;
  actualPickupDate: Date | null;
  actualReturnDate: Date | null;
  status: string;
  locationName: string | null;
  notes: string | null;
  createdAt: Date;
}

export async function getAllRentals(
  filters: RentalFilters = {}
): Promise<RentalRecord[]> {
  const { status, search, limit = 100 } = filters;

  const results = await db
    .select({
      id: reservations.id,
      toolId: tools.id,
      toolName: tools.name,
      toolSlug: tools.slug,
      memberId: users.id,
      memberName: users.name,
      memberEmail: users.email,
      pickupDate: reservations.pickupDate,
      returnDate: reservations.returnDate,
      actualPickupDate: reservations.actualPickupDate,
      actualReturnDate: reservations.actualReturnDate,
      status: reservations.status,
      locationName: locations.name,
      notes: reservations.notes,
      createdAt: reservations.createdAt,
    })
    .from(reservations)
    .innerJoin(tools, eq(reservations.toolId, tools.id))
    .innerJoin(users, eq(reservations.userId, users.id))
    .leftJoin(locations, eq(reservations.locationId, locations.id))
    .orderBy(desc(reservations.createdAt))
    .limit(limit);

  let filtered = results;

  if (status && status !== "all") {
    filtered = filtered.filter((r) => r.status === status);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.toolName.toLowerCase().includes(q) ||
        r.memberEmail.toLowerCase().includes(q) ||
        (r.memberName?.toLowerCase().includes(q) ?? false)
    );
  }

  return filtered;
}

// ── All Tools (with filters) ───────────────────────────────────────────

export interface ToolFilters {
  status?: string;
  category?: string;
  location?: string;
  search?: string;
  limit?: number;
}

export interface ToolRecord {
  id: string;
  name: string;
  slug: string;
  assetId: string | null;
  brand: string | null;
  model: string | null;
  description: string | null;
  imageUrl: string | null;
  status: string;
  categoryId: string | null;
  categoryName: string | null;
  locationId: string | null;
  locationName: string | null;
  skillLevel: string | null;
  replacementCost: string | null;
  serialNumber: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function getAllTools(
  filters: ToolFilters = {}
): Promise<ToolRecord[]> {
  const { status, category, location, search, limit = 200 } = filters;

  const results = await db
    .select({
      id: tools.id,
      name: tools.name,
      slug: tools.slug,
      assetId: tools.assetId,
      brand: tools.brand,
      model: tools.model,
      description: tools.description,
      imageUrl: tools.imageUrl,
      status: tools.status,
      categoryId: tools.categoryId,
      categoryName: categories.name,
      locationId: tools.locationId,
      locationName: locations.name,
      skillLevel: tools.skillLevel,
      replacementCost: tools.replacementCost,
      serialNumber: tools.serialNumber,
      isActive: tools.isActive,
      createdAt: tools.createdAt,
      updatedAt: tools.updatedAt,
    })
    .from(tools)
    .leftJoin(categories, eq(tools.categoryId, categories.id))
    .leftJoin(locations, eq(tools.locationId, locations.id))
    .orderBy(asc(tools.name))
    .limit(limit);

  let filtered = results;

  if (status && status !== "all") {
    filtered = filtered.filter((t) => t.status === status);
  }

  if (category && category !== "all") {
    filtered = filtered.filter((t) => t.categoryId === category);
  }

  if (location && location !== "all") {
    filtered = filtered.filter((t) => t.locationId === location);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        (t.brand?.toLowerCase().includes(q) ?? false) ||
        (t.model?.toLowerCase().includes(q) ?? false) ||
        (t.assetId?.toLowerCase().includes(q) ?? false) ||
        (t.serialNumber?.toLowerCase().includes(q) ?? false)
    );
  }

  return filtered;
}

// ── All Categories ─────────────────────────────────────────────────────

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export async function getAllCategories(): Promise<CategoryRecord[]> {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      status: categories.status,
    })
    .from(categories)
    .where(eq(categories.status, "active"))
    .orderBy(asc(categories.name));
}

// ── All Locations ──────────────────────────────────────────────────────

export interface LocationRecord {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  status: string;
}

export async function getAllLocations(): Promise<LocationRecord[]> {
  return db
    .select({
      id: locations.id,
      name: locations.name,
      city: locations.city,
      state: locations.state,
      status: locations.status,
    })
    .from(locations)
    .where(eq(locations.status, "active"))
    .orderBy(asc(locations.name));
}

// ── All Reservations (with filters) ────────────────────────────────────

export interface ReservationFilters {
  status?: string;
  search?: string;
  dateRange?: "upcoming" | "past" | "all";
  limit?: number;
}

export interface ReservationRecord {
  id: string;
  toolId: string;
  toolName: string;
  toolSlug: string;
  memberId: string;
  memberName: string | null;
  memberEmail: string;
  pickupDate: string;
  pickupTime: string | null;
  returnDate: string;
  returnTime: string | null;
  status: string;
  locationName: string | null;
  notes: string | null;
  createdAt: Date;
}

export async function getAllReservations(
  filters: ReservationFilters = {}
): Promise<ReservationRecord[]> {
  const { status, search, dateRange = "all", limit = 100 } = filters;
  const today = new Date().toISOString().split("T")[0];

  const results = await db
    .select({
      id: reservations.id,
      toolId: tools.id,
      toolName: tools.name,
      toolSlug: tools.slug,
      memberId: users.id,
      memberName: users.name,
      memberEmail: users.email,
      pickupDate: reservations.pickupDate,
      pickupTime: reservations.pickupTime,
      returnDate: reservations.returnDate,
      returnTime: reservations.returnTime,
      status: reservations.status,
      locationName: locations.name,
      notes: reservations.notes,
      createdAt: reservations.createdAt,
    })
    .from(reservations)
    .innerJoin(tools, eq(reservations.toolId, tools.id))
    .innerJoin(users, eq(reservations.userId, users.id))
    .leftJoin(locations, eq(reservations.locationId, locations.id))
    .orderBy(desc(reservations.createdAt))
    .limit(limit);

  let filtered = results;

  if (status && status !== "all") {
    filtered = filtered.filter((r) => r.status === status);
  }

  if (dateRange === "upcoming") {
    filtered = filtered.filter((r) => r.pickupDate >= today);
  } else if (dateRange === "past") {
    filtered = filtered.filter((r) => r.returnDate < today);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.toolName.toLowerCase().includes(q) ||
        r.memberEmail.toLowerCase().includes(q) ||
        (r.memberName?.toLowerCase().includes(q) ?? false) ||
        r.id.toLowerCase().includes(q)
    );
  }

  return filtered;
}

// ── All Customers (with filters) ───────────────────────────────────────

export interface CustomerFilters {
  role?: string;
  search?: string;
  limit?: number;
}

export interface CustomerRecord {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  memberNumber: string | null;
  membershipStatus: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  reservationCount: number;
}

export async function getAllCustomers(
  filters: CustomerFilters = {}
): Promise<CustomerRecord[]> {
  const { role, search, limit = 200 } = filters;

  const results = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      memberNumber: memberProfiles.memberNumber,
      membershipStatus: memberProfiles.membershipStatus,
      phone: memberProfiles.phone,
      city: memberProfiles.city,
      state: memberProfiles.state,
    })
    .from(users)
    .leftJoin(memberProfiles, eq(users.id, memberProfiles.userId))
    .orderBy(desc(users.createdAt))
    .limit(limit);

  const reservationCounts = await db
    .select({
      userId: reservations.userId,
      count: count(),
    })
    .from(reservations)
    .groupBy(reservations.userId);

  const countMap = new Map(reservationCounts.map((r) => [r.userId, r.count]));

  let filtered = results.map((r) => ({
    ...r,
    reservationCount: countMap.get(r.id) ?? 0,
  }));

  if (role && role !== "all") {
    filtered = filtered.filter((c) => c.role === role);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.email.toLowerCase().includes(q) ||
        (c.name?.toLowerCase().includes(q) ?? false) ||
        (c.memberNumber?.toLowerCase().includes(q) ?? false)
    );
  }

  return filtered;
}

// ── Customer By ID ─────────────────────────────────────────────────────

export async function getCustomerById(
  id: string
): Promise<CustomerRecord | null> {
  const [customer] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      memberNumber: memberProfiles.memberNumber,
      membershipStatus: memberProfiles.membershipStatus,
      phone: memberProfiles.phone,
      city: memberProfiles.city,
      state: memberProfiles.state,
    })
    .from(users)
    .leftJoin(memberProfiles, eq(users.id, memberProfiles.userId))
    .where(eq(users.id, id))
    .limit(1);

  if (!customer) return null;

  const [resCount] = await db
    .select({ count: count() })
    .from(reservations)
    .where(eq(reservations.userId, id));

  return {
    ...customer,
    reservationCount: resCount?.count ?? 0,
  };
}

// ── Universal Search ───────────────────────────────────────────────────

export interface SearchResults {
  tools: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    categoryName: string | null;
  }>;
  users: Array<{
    id: string;
    name: string | null;
    email: string;
    role: string;
  }>;
  reservations: Array<{
    id: string;
    toolName: string;
    memberEmail: string;
    status: string;
    pickupDate: string;
  }>;
}

export async function universalSearch(query: string): Promise<SearchResults> {
  const q = query.toLowerCase();

  // Search tools
  const toolResults = await db
    .select({
      id: tools.id,
      name: tools.name,
      slug: tools.slug,
      status: tools.status,
      categoryName: categories.name,
    })
    .from(tools)
    .leftJoin(categories, eq(tools.categoryId, categories.id))
    .where(eq(tools.isActive, true))
    .limit(50);

  const filteredTools = toolResults
    .filter(
      (t) =>
        t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q)
    )
    .slice(0, 10);

  // Search users
  const userResults = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.isActive, true))
    .limit(50);

  const filteredUsers = userResults
    .filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.name?.toLowerCase().includes(q) ?? false)
    )
    .slice(0, 10);

  // Search reservations
  const reservationResults = await db
    .select({
      id: reservations.id,
      toolName: tools.name,
      memberEmail: users.email,
      status: reservations.status,
      pickupDate: reservations.pickupDate,
    })
    .from(reservations)
    .innerJoin(tools, eq(reservations.toolId, tools.id))
    .innerJoin(users, eq(reservations.userId, users.id))
    .orderBy(desc(reservations.createdAt))
    .limit(50);

  const filteredReservations = reservationResults
    .filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.toolName.toLowerCase().includes(q) ||
        r.memberEmail.toLowerCase().includes(q)
    )
    .slice(0, 10);

  return {
    tools: filteredTools,
    users: filteredUsers,
    reservations: filteredReservations,
  };
}

// ══════════════════════════════════════════════════════════════════════
// Tool Detail Queries
// ══════════════════════════════════════════════════════════════════════

export interface ToolDetailRecord {
  id: string;
  assetId: string | null;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  model: string | null;
  imageUrl: string | null;
  status: string;
  categoryId: string | null;
  categoryName: string | null;
  locationId: string | null;
  locationName: string | null;
  skillLevel: string | null;
  replacementCost: string | null;
  serialNumber: string | null;
  conditionNotes: string | null;
  specifications: unknown;
  safetyInfo: string | null;
  userManualUrl: string | null;
  quickStartGuideUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function getToolById(id: string): Promise<ToolDetailRecord | null> {
  const [tool] = await db
    .select({
      id: tools.id,
      assetId: tools.assetId,
      name: tools.name,
      slug: tools.slug,
      description: tools.description,
      brand: tools.brand,
      model: tools.model,
      imageUrl: tools.imageUrl,
      status: tools.status,
      categoryId: tools.categoryId,
      categoryName: categories.name,
      locationId: tools.locationId,
      locationName: locations.name,
      skillLevel: tools.skillLevel,
      replacementCost: tools.replacementCost,
      serialNumber: tools.serialNumber,
      conditionNotes: tools.conditionNotes,
      specifications: tools.specifications,
      safetyInfo: tools.safetyInfo,
      userManualUrl: tools.userManualUrl,
      quickStartGuideUrl: tools.quickStartGuideUrl,
      isActive: tools.isActive,
      createdAt: tools.createdAt,
      updatedAt: tools.updatedAt,
    })
    .from(tools)
    .leftJoin(categories, eq(tools.categoryId, categories.id))
    .leftJoin(locations, eq(tools.locationId, locations.id))
    .where(eq(tools.id, id))
    .limit(1);

  return tool ?? null;
}

export interface ToolImageRecord {
  id: string;
  toolId: string;
  imageUrl: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: Date;
}

export async function getToolImages(toolId: string): Promise<ToolImageRecord[]> {
  return db
    .select({
      id: toolImages.id,
      toolId: toolImages.toolId,
      imageUrl: toolImages.imageUrl,
      altText: toolImages.altText,
      isPrimary: toolImages.isPrimary,
      sortOrder: toolImages.sortOrder,
      createdAt: toolImages.createdAt,
    })
    .from(toolImages)
    .where(eq(toolImages.toolId, toolId))
    .orderBy(desc(toolImages.isPrimary), asc(toolImages.sortOrder));
}

export interface ToolAccessoryRecord {
  id: string;
  toolId: string;
  name: string;
  description: string | null;
  isIncluded: boolean;
  createdAt: Date;
}

export async function getToolAccessories(
  toolId: string
): Promise<ToolAccessoryRecord[]> {
  return db
    .select({
      id: toolAccessories.id,
      toolId: toolAccessories.toolId,
      name: toolAccessories.name,
      description: toolAccessories.description,
      isIncluded: toolAccessories.isIncluded,
      createdAt: toolAccessories.createdAt,
    })
    .from(toolAccessories)
    .where(eq(toolAccessories.toolId, toolId))
    .orderBy(asc(toolAccessories.name));
}

export interface ToolReservationRecord {
  id: string;
  memberId: string;
  memberName: string | null;
  memberEmail: string;
  pickupDate: string;
  returnDate: string;
  status: string;
  locationName: string | null;
  notes: string | null;
  createdAt: Date;
}

export async function getToolReservations(
  toolId: string,
  limit = 50
): Promise<ToolReservationRecord[]> {
  return db
    .select({
      id: reservations.id,
      memberId: users.id,
      memberName: users.name,
      memberEmail: users.email,
      pickupDate: reservations.pickupDate,
      returnDate: reservations.returnDate,
      status: reservations.status,
      locationName: locations.name,
      notes: reservations.notes,
      createdAt: reservations.createdAt,
    })
    .from(reservations)
    .innerJoin(users, eq(reservations.userId, users.id))
    .leftJoin(locations, eq(reservations.locationId, locations.id))
    .where(eq(reservations.toolId, toolId))
    .orderBy(desc(reservations.createdAt))
    .limit(limit);
}

export interface MaintenanceRecord {
  id: string;
  toolId: string;
  performedById: string | null;
  performedByName: string | null;
  performedByEmail: string | null;
  maintenanceType: string;
  description: string;
  cost: string | null;
  performedAt: Date;
  nextDueAt: Date | null;
  notes: string | null;
  createdAt: Date;
}

export async function getToolMaintenanceRecords(
  toolId: string,
  limit = 50
): Promise<MaintenanceRecord[]> {
  return db
    .select({
      id: toolMaintenanceRecords.id,
      toolId: toolMaintenanceRecords.toolId,
      performedById: toolMaintenanceRecords.performedById,
      performedByName: users.name,
      performedByEmail: users.email,
      maintenanceType: toolMaintenanceRecords.maintenanceType,
      description: toolMaintenanceRecords.description,
      cost: toolMaintenanceRecords.cost,
      performedAt: toolMaintenanceRecords.performedAt,
      nextDueAt: toolMaintenanceRecords.nextDueAt,
      notes: toolMaintenanceRecords.notes,
      createdAt: toolMaintenanceRecords.createdAt,
    })
    .from(toolMaintenanceRecords)
    .leftJoin(users, eq(toolMaintenanceRecords.performedById, users.id))
    .where(eq(toolMaintenanceRecords.toolId, toolId))
    .orderBy(desc(toolMaintenanceRecords.performedAt))
    .limit(limit);
}

export async function getNextMaintenanceDue(
  toolId: string
): Promise<Date | null> {
  const [record] = await db
    .select({ nextDueAt: toolMaintenanceRecords.nextDueAt })
    .from(toolMaintenanceRecords)
    .where(
      and(
        eq(toolMaintenanceRecords.toolId, toolId),
        sql`${toolMaintenanceRecords.nextDueAt} IS NOT NULL`
      )
    )
    .orderBy(asc(toolMaintenanceRecords.nextDueAt))
    .limit(1);

  return record?.nextDueAt ?? null;
}
