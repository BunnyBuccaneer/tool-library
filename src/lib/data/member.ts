import { db } from "@/db";
import {
  reservations,
  tools,
  favorites,
  savedProjects,
  projects,
  memberProfiles,
  notifications,
  userPreferences,
  locations,
} from "@/db/schema";
import { eq, and, inArray, desc, gte, lte, count } from "drizzle-orm";

export async function getCurrentRentals(userId: string) {
  return db
    .select({
      reservation: reservations,
      tool: tools,
      location: locations,
    })
    .from(reservations)
    .innerJoin(tools, eq(reservations.toolId, tools.id))
    .leftJoin(locations, eq(reservations.locationId, locations.id))
    .where(
      and(
        eq(reservations.userId, userId),
        eq(reservations.status, "checked_out")
      )
    )
    .orderBy(reservations.returnDate);
}

export async function getUpcomingReservations(userId: string) {
  return db
    .select({
      reservation: reservations,
      tool: tools,
      location: locations,
    })
    .from(reservations)
    .innerJoin(tools, eq(reservations.toolId, tools.id))
    .leftJoin(locations, eq(reservations.locationId, locations.id))
    .where(
      and(
        eq(reservations.userId, userId),
        inArray(reservations.status, ["pending", "confirmed"])
      )
    )
    .orderBy(reservations.pickupDate);
}

export async function getRentalHistory(
  userId: string,
  fromDate?: string,
  toDate?: string
) {
  const conditions = [
    eq(reservations.userId, userId),
    inArray(reservations.status, ["returned", "cancelled"]),
  ];

  if (fromDate) {
    conditions.push(gte(reservations.pickupDate, fromDate));
  }
  if (toDate) {
    conditions.push(lte(reservations.returnDate, toDate));
  }

  return db
    .select({
      reservation: reservations,
      tool: tools,
      location: locations,
    })
    .from(reservations)
    .innerJoin(tools, eq(reservations.toolId, tools.id))
    .leftJoin(locations, eq(reservations.locationId, locations.id))
    .where(and(...conditions))
    .orderBy(desc(reservations.updatedAt));
}

export async function getFavoriteTools(userId: string) {
  return db
    .select({
      favorite: favorites,
      tool: tools,
    })
    .from(favorites)
    .innerJoin(tools, eq(favorites.toolId, tools.id))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));
}

export async function getSavedProjects(userId: string) {
  return db
    .select({
      savedProject: savedProjects,
      project: projects,
    })
    .from(savedProjects)
    .innerJoin(projects, eq(savedProjects.projectId, projects.id))
    .where(eq(savedProjects.userId, userId))
    .orderBy(desc(savedProjects.createdAt));
}

export async function getMembership(userId: string) {
  const [profile] = await db
    .select({
      profile: memberProfiles,
      location: locations,
    })
    .from(memberProfiles)
    .leftJoin(locations, eq(memberProfiles.preferredLocationId, locations.id))
    .where(eq(memberProfiles.userId, userId))
    .limit(1);

  return profile ?? null;
}

export async function getNotifications(userId: string) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function getUnreadNotificationCount(userId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false))
    );
  return result?.count ?? 0;
}

export async function getUserPreferences(userId: string) {
  const [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  return prefs ?? null;
}

export async function getMemberProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(memberProfiles)
    .where(eq(memberProfiles.userId, userId))
    .limit(1);
  return profile ?? null;
}
