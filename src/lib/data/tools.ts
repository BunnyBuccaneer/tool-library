import { db } from "@/db";
import {
  tools,
  categories,
  locations,
  toolImages,
  toolAccessories,
  reservations,
  favorites,
} from "@/db/schema";
import {
  eq,
  and,
  ilike,
  sql,
  asc,
  desc,
  count,
  gte,
  lte,
  ne,
  type SQL,
} from "drizzle-orm";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import type {
  CatalogSearchParams,
  CatalogData,
  ToolWithRelations,
  ToolDetailData,
} from "@/lib/types";

// UUID validation to prevent invalid database queries
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1500
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      console.log("\n====================================");
      console.log(`DATABASE ERROR (Attempt ${attempt}/${retries})`);
      console.log("====================================");

      console.dir(error, { depth: null, colors: true });

      if (error && typeof error === "object" && "cause" in error) {
        console.log("\nCAUSE:");
        console.dir((error as { cause: unknown }).cause, {
          depth: null,
          colors: true,
        });
      }

      if (error instanceof AggregateError) {
        console.log("\nAGGREGATE ERRORS:");
        for (const err of error.errors) {
          console.dir(err, { depth: null, colors: true });
        }
      }

      if (attempt < retries) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  console.log("\n============= FINAL ERROR =============");
  console.dir(lastError, { depth: null, colors: true });

  throw lastError;
}

export async function getCatalogData(
  params: CatalogSearchParams
): Promise<CatalogData> {
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const offset = (page - 1) * ITEMS_PER_PAGE;

  const conditions: SQL[] = [eq(tools.isActive, true)];

  if (params.search) {
    const searchTerm = `%${params.search}%`;
    conditions.push(
      sql`(${ilike(tools.name, searchTerm)} OR ${ilike(
        tools.brand,
        searchTerm
      )} OR ${ilike(tools.description, searchTerm)} OR ${ilike(
        tools.model,
        searchTerm
      )})`
    );
  }

  if (params.category && params.category !== "all") {
    conditions.push(
      eq(
        tools.categoryId,
        sql`(SELECT id FROM categories WHERE slug = ${params.category})`
      )
    );
  }

  if (params.status && params.status !== "all") {
    conditions.push(
      eq(tools.status, params.status as (typeof tools.status.enumValues)[number])
    );
  }

  if (params.skillLevel && params.skillLevel !== "all") {
    conditions.push(
      eq(
        tools.skillLevel,
        params.skillLevel as (typeof tools.skillLevel.enumValues)[number]
      )
    );
  }

  if (params.brand && params.brand !== "all") {
    conditions.push(eq(tools.brand, params.brand));
  }

  if (params.location && params.location !== "all" && isValidUuid(params.location)) {
    conditions.push(eq(tools.locationId, params.location));
  }

  const whereClause = and(...conditions);

  let orderBy;
  switch (params.sort) {
    case "name_desc":
      orderBy = desc(tools.name);
      break;
    case "brand_asc":
      orderBy = asc(tools.brand);
      break;
    case "brand_desc":
      orderBy = desc(tools.brand);
      break;
    case "newest":
      orderBy = desc(tools.createdAt);
      break;
    case "oldest":
      orderBy = asc(tools.createdAt);
      break;
    case "name_asc":
    default:
      orderBy = asc(tools.name);
      break;
  }

  const [
    toolRows,
    countResult,
    categoryRows,
    brandRows,
    statusRows,
    skillRows,
    locationRows,
  ] = await withRetry(() =>
    Promise.all([
      db
        .select({
          id: tools.id,
          assetId: tools.assetId,
          name: tools.name,
          slug: tools.slug,
          description: tools.description,
          brand: tools.brand,
          model: tools.model,
          imageUrl: tools.imageUrl,
          categoryId: tools.categoryId,
          locationId: tools.locationId,
          status: tools.status,
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
          categoryName: categories.name,
          categorySlug: categories.slug,
          categoryDescription: categories.description,
          categoryIcon: categories.icon,
          categoryStatus: categories.status,
          categoryParentId: categories.parentId,
          categorySortOrder: categories.sortOrder,
          categoryCreatedAt: categories.createdAt,
          categoryUpdatedAt: categories.updatedAt,
          locationName: locations.name,
          locationAddress: locations.address,
          locationCity: locations.city,
          locationState: locations.state,
          locationZipCode: locations.zipCode,
          locationPhone: locations.phone,
          locationEmail: locations.email,
          locationStatus: locations.status,
          locationCreatedAt: locations.createdAt,
          locationUpdatedAt: locations.updatedAt,
        })
        .from(tools)
        .innerJoin(categories, eq(tools.categoryId, categories.id))
        .leftJoin(locations, eq(tools.locationId, locations.id))
        .where(whereClause)
        .orderBy(orderBy)
        .limit(ITEMS_PER_PAGE)
        .offset(offset),

      db.select({ total: count() }).from(tools).where(whereClause),

      db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          count: count(tools.id),
        })
        .from(categories)
        .leftJoin(
          tools,
          and(eq(tools.categoryId, categories.id), eq(tools.isActive, true))
        )
        .where(eq(categories.status, "active"))
        .groupBy(categories.id, categories.name, categories.slug)
        .orderBy(asc(categories.name)),

      db
        .select({
          name: tools.brand,
          count: count(tools.id),
        })
        .from(tools)
        .where(eq(tools.isActive, true))
        .groupBy(tools.brand)
        .orderBy(asc(tools.brand)),

      db
        .select({
          value: tools.status,
          count: count(tools.id),
        })
        .from(tools)
        .where(eq(tools.isActive, true))
        .groupBy(tools.status),

      db
        .select({
          value: tools.skillLevel,
          count: count(tools.id),
        })
        .from(tools)
        .where(eq(tools.isActive, true))
        .groupBy(tools.skillLevel),

      db
        .select({
          id: locations.id,
          name: locations.name,
          count: count(tools.id),
        })
        .from(locations)
        .leftJoin(
          tools,
          and(eq(tools.locationId, locations.id), eq(tools.isActive, true))
        )
        .where(eq(locations.status, "active"))
        .groupBy(locations.id, locations.name)
        .orderBy(asc(locations.name)),
    ])
  );

  const totalItems = countResult[0]?.total ?? 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const toolsWithRelations: ToolWithRelations[] = toolRows.map((row) => ({
    id: row.id,
    assetId: row.assetId,
    name: row.name,
    slug: row.slug,
    description: row.description,
    brand: row.brand,
    model: row.model,
    imageUrl: row.imageUrl,
    categoryId: row.categoryId,
    locationId: row.locationId,
    status: row.status,
    skillLevel: row.skillLevel,
    replacementCost: row.replacementCost,
    serialNumber: row.serialNumber,
    conditionNotes: row.conditionNotes,
    specifications: row.specifications,
    safetyInfo: row.safetyInfo,
    userManualUrl: row.userManualUrl,
    quickStartGuideUrl: row.quickStartGuideUrl,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    category: {
      id: row.categoryId ?? "",
      name: row.categoryName,
      slug: row.categorySlug,
      description: row.categoryDescription,
      icon: row.categoryIcon,
      status: row.categoryStatus,
      parentId: row.categoryParentId,
      sortOrder: row.categorySortOrder,
      createdAt: row.categoryCreatedAt,
      updatedAt: row.categoryUpdatedAt,
    },
    location: row.locationId
      ? {
          id: row.locationId,
          name: row.locationName!,
          address: row.locationAddress,
          city: row.locationCity,
          state: row.locationState,
          zipCode: row.locationZipCode,
          phone: row.locationPhone,
          email: row.locationEmail,
          status: row.locationStatus!,
          createdAt: row.locationCreatedAt!,
          updatedAt: row.locationUpdatedAt!,
        }
      : null,
  }));

  return {
    tools: toolsWithRelations,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: ITEMS_PER_PAGE,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    filters: {
      categories: categoryRows.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        count: c.count,
      })),
      brands: brandRows
        .filter((b) => b.name !== null)
        .map((b) => ({ name: b.name as string, count: b.count })),
      statuses: statusRows.map((s) => ({ value: s.value, count: s.count })),
      skillLevels: skillRows
        .filter((s) => s.value !== null)
        .map((s) => ({ value: s.value as string, count: s.count })),
      locations: locationRows.map((l) => ({
        id: l.id,
        name: l.name,
        count: l.count,
      })),
    },
  };
}

export async function getToolBySlug(
  slug: string
): Promise<ToolDetailData | null> {
  const toolRows = await withRetry(() =>
    db
      .select({
        id: tools.id,
        assetId: tools.assetId,
        name: tools.name,
        slug: tools.slug,
        description: tools.description,
        brand: tools.brand,
        model: tools.model,
        imageUrl: tools.imageUrl,
        categoryId: tools.categoryId,
        locationId: tools.locationId,
        status: tools.status,
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
        categoryName: categories.name,
        categorySlug: categories.slug,
        categoryDescription: categories.description,
        categoryIcon: categories.icon,
        categoryStatus: categories.status,
        categoryParentId: categories.parentId,
        categorySortOrder: categories.sortOrder,
        categoryCreatedAt: categories.createdAt,
        categoryUpdatedAt: categories.updatedAt,
        locationName: locations.name,
        locationAddress: locations.address,
        locationCity: locations.city,
        locationState: locations.state,
        locationZipCode: locations.zipCode,
        locationPhone: locations.phone,
        locationEmail: locations.email,
        locationStatus: locations.status,
        locationCreatedAt: locations.createdAt,
        locationUpdatedAt: locations.updatedAt,
      })
      .from(tools)
      .innerJoin(categories, eq(tools.categoryId, categories.id))
      .leftJoin(locations, eq(tools.locationId, locations.id))
      .where(and(eq(tools.slug, slug), eq(tools.isActive, true)))
      .limit(1)
  );

  if (toolRows.length === 0) return null;

  const row = toolRows[0];

  const [images, accessories] = await withRetry(() =>
    Promise.all([
      db
        .select()
        .from(toolImages)
        .where(eq(toolImages.toolId, row.id))
        .orderBy(desc(toolImages.isPrimary), asc(toolImages.sortOrder)),
      db
        .select()
        .from(toolAccessories)
        .where(eq(toolAccessories.toolId, row.id))
        .orderBy(asc(toolAccessories.name)),
    ])
  );

  return {
    id: row.id,
    assetId: row.assetId,
    name: row.name,
    slug: row.slug,
    description: row.description,
    brand: row.brand,
    model: row.model,
    imageUrl: row.imageUrl,
    categoryId: row.categoryId ?? "",
    locationId: row.locationId,
    status: row.status,
    skillLevel: row.skillLevel ?? null,
    replacementCost: row.replacementCost,
    serialNumber: row.serialNumber,
    conditionNotes: row.conditionNotes,
    specifications: row.specifications,
    safetyInfo: row.safetyInfo,
    userManualUrl: row.userManualUrl,
    quickStartGuideUrl: row.quickStartGuideUrl,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    category: {
      id: row.categoryId ?? "",
      name: row.categoryName,
      slug: row.categorySlug,
      description: row.categoryDescription,
      icon: row.categoryIcon,
      status: row.categoryStatus,
      parentId: row.categoryParentId,
      sortOrder: row.categorySortOrder,
      createdAt: row.categoryCreatedAt,
      updatedAt: row.categoryUpdatedAt,
    },
    location: row.locationId
      ? {
          id: row.locationId,
          name: row.locationName!,
          address: row.locationAddress,
          city: row.locationCity,
          state: row.locationState,
          zipCode: row.locationZipCode,
          phone: row.locationPhone,
          email: row.locationEmail,
          status: row.locationStatus!,
          createdAt: row.locationCreatedAt!,
          updatedAt: row.locationUpdatedAt!,
        }
      : null,
    images,
    accessories,
  };
}

export async function getToolReservations(
  toolId: string,
  startDate: Date,
  endDate: Date
) {
  // Guard against invalid tool IDs (e.g. "new") to prevent DB errors
  if (!isValidUuid(toolId)) {
    return [];
  }

  return withRetry(() =>
    db
      .select({
        id: reservations.id,
        pickupDate: reservations.pickupDate,
        returnDate: reservations.returnDate,
        status: reservations.status,
      })
      .from(reservations)
      .where(
        and(
          eq(reservations.toolId, toolId),
          ne(reservations.status, "cancelled"),
          gte(reservations.returnDate, startDate.toISOString().split("T")[0]),
          lte(reservations.pickupDate, endDate.toISOString().split("T")[0])
        )
      )
  );
}

export async function getRelatedTools(
  categoryId: string,
  excludeToolId: string,
  limit: number = 3
): Promise<ToolWithRelations[]> {
  // Guard against invalid IDs
  if (!isValidUuid(categoryId) || !isValidUuid(excludeToolId)) {
    return [];
  }

  const rows = await withRetry(() =>
    db
      .select({
        id: tools.id,
        assetId: tools.assetId,
        name: tools.name,
        slug: tools.slug,
        description: tools.description,
        brand: tools.brand,
        model: tools.model,
        imageUrl: tools.imageUrl,
        categoryId: tools.categoryId,
        locationId: tools.locationId,
        status: tools.status,
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
        categoryName: categories.name,
        categorySlug: categories.slug,
        categoryDescription: categories.description,
        categoryIcon: categories.icon,
        categoryStatus: categories.status,
        categoryParentId: categories.parentId,
        categorySortOrder: categories.sortOrder,
        categoryCreatedAt: categories.createdAt,
        categoryUpdatedAt: categories.updatedAt,
        locationName: locations.name,
        locationAddress: locations.address,
        locationCity: locations.city,
        locationState: locations.state,
        locationZipCode: locations.zipCode,
        locationPhone: locations.phone,
        locationEmail: locations.email,
        locationStatus: locations.status,
        locationCreatedAt: locations.createdAt,
        locationUpdatedAt: locations.updatedAt,
      })
      .from(tools)
      .innerJoin(categories, eq(tools.categoryId, categories.id))
      .leftJoin(locations, eq(tools.locationId, locations.id))
      .where(
        and(
          eq(tools.categoryId, categoryId),
          ne(tools.id, excludeToolId),
          eq(tools.isActive, true)
        )
      )
      .orderBy(sql`RANDOM()`)
      .limit(limit)
  );

  return rows.map((row) => ({
    id: row.id,
    assetId: row.assetId,
    name: row.name,
    slug: row.slug,
    description: row.description,
    brand: row.brand,
    model: row.model,
    imageUrl: row.imageUrl,
    categoryId: row.categoryId,
    locationId: row.locationId,
    status: row.status,
    skillLevel: row.skillLevel,
    replacementCost: row.replacementCost,
    serialNumber: row.serialNumber,
    conditionNotes: row.conditionNotes,
    specifications: row.specifications,
    safetyInfo: row.safetyInfo,
    userManualUrl: row.userManualUrl,
    quickStartGuideUrl: row.quickStartGuideUrl,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    category: {
      id: row.categoryId ?? "",
      name: row.categoryName,
      slug: row.categorySlug,
      description: row.categoryDescription,
      icon: row.categoryIcon,
      status: row.categoryStatus,
      parentId: row.categoryParentId,
      sortOrder: row.categorySortOrder,
      createdAt: row.categoryCreatedAt,
      updatedAt: row.categoryUpdatedAt,
    },
    location: row.locationId
      ? {
          id: row.locationId,
          name: row.locationName!,
          address: row.locationAddress,
          city: row.locationCity,
          state: row.locationState,
          zipCode: row.locationZipCode,
          phone: row.locationPhone,
          email: row.locationEmail,
          status: row.locationStatus!,
          createdAt: row.locationCreatedAt!,
          updatedAt: row.locationUpdatedAt!,
        }
      : null,
  }));
}

export async function getActiveLocations() {
  return withRetry(() =>
    db
      .select({
        id: locations.id,
        name: locations.name,
        city: locations.city,
        state: locations.state,
      })
      .from(locations)
      .where(eq(locations.status, "active"))
      .orderBy(asc(locations.name))
  );
}

/**
 * Check if a tool is favorited by a given user.
 * Uses composite primary key (userId, toolId) since favorites has no id column.
 */
export async function isFavoritedByUser(
  toolId: string,
  userId: string
): Promise<boolean> {
  if (!isValidUuid(toolId) || !isValidUuid(userId)) {
    return false;
  }

  const rows = await db
    .select({ userId: favorites.userId })
    .from(favorites)
    .where(and(eq(favorites.toolId, toolId), eq(favorites.userId, userId)))
    .limit(1);

  return rows.length > 0;
}