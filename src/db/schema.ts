import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  date,
  time,
  decimal,
  integer,
  jsonb,
  pgEnum,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ──────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "admin",
  "manager",
  "employee",
  "member",
]);

export const membershipStatusEnum = pgEnum("membership_status", [
  "active",
  "inactive",
  "suspended",
  "expired",
  "pending",
]);

export const locationStatusEnum = pgEnum("location_status", [
  "active",
  "inactive",
  "maintenance",
]);

export const toolStatusEnum = pgEnum("tool_status", [
  "available",
  "checked_out",
  "reserved",
  "maintenance",
  "retired",
]);

export const skillLevelEnum = pgEnum("skill_level", [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
]);

export const categoryStatusEnum = pgEnum("category_status", [
  "active",
  "inactive",
]);

export const reservationStatusEnum = pgEnum("reservation_status", [
  "pending",
  "confirmed",
  "checked_out",
  "returned",
  "cancelled",
  "overdue",
]);

export const projectDifficultyEnum = pgEnum("project_difficulty", [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "reservation_reminder",
  "pickup_reminder",
  "return_reminder",
  "overdue",
  "membership_expiring",
  "general",
]);

export const maintenanceTypeEnum = pgEnum("maintenance_type", [
  "routine",
  "repair",
  "inspection",
  "calibration",
  "cleaning",
  "replacement",
  "other",
]);

// ── Tables ─────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  hashedPassword: text("hashed_password"),
  image: text("image"),
  role: userRoleEnum("role").default("member").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: varchar("token_type", { length: 255 }),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires").notNull(),
  },
  (table) => [uniqueIndex("verification_tokens_token_idx").on(table.token)]
);

export const locations = pgTable("locations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 255 }),
  state: varchar("state", { length: 100 }),
  zipCode: varchar("zip_code", { length: 20 }),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 255 }),
  status: locationStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const memberProfiles = pgTable("member_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  memberNumber: varchar("member_number", { length: 50 }).notNull().unique(),
  phone: varchar("phone", { length: 30 }),
  address: text("address"),
  city: varchar("city", { length: 255 }),
  state: varchar("state", { length: 100 }),
  zipCode: varchar("zip_code", { length: 20 }),
  membershipStatus: membershipStatusEnum("membership_status")
    .default("active")
    .notNull(),
  preferredLocationId: uuid("preferred_location_id").references(
    () => locations.id
  ),
  joinDate: date("join_date").defaultNow().notNull(),
  expirationDate: date("expiration_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }),
  status: categoryStatusEnum("status").default("active").notNull(),
  parentId: uuid("parent_id"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tools = pgTable("tools", {
  id: uuid("id").defaultRandom().primaryKey(),
  assetId: varchar("asset_id", { length: 100 }),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  brand: varchar("brand", { length: 255 }),
  model: varchar("model", { length: 255 }),
  imageUrl: text("image_url"),
  categoryId: uuid("category_id").references(() => categories.id),
  locationId: uuid("location_id").references(() => locations.id),
  status: toolStatusEnum("status").default("available").notNull(),
  skillLevel: skillLevelEnum("skill_level"),
  replacementCost: decimal("replacement_cost", { precision: 10, scale: 2 }),
  serialNumber: varchar("serial_number", { length: 255 }),
  conditionNotes: text("condition_notes"),
  specifications: jsonb("specifications"),
  safetyInfo: text("safety_info"),
  userManualUrl: text("user_manual_url"),
  quickStartGuideUrl: text("quick_start_guide_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const toolImages = pgTable("tool_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  toolId: uuid("tool_id")
    .notNull()
    .references(() => tools.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  altText: varchar("alt_text", { length: 255 }),
  isPrimary: boolean("is_primary").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const toolAccessories = pgTable("tool_accessories", {
  id: uuid("id").defaultRandom().primaryKey(),
  toolId: uuid("tool_id")
    .notNull()
    .references(() => tools.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isIncluded: boolean("is_included").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const toolMaintenanceRecords = pgTable("tool_maintenance_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  toolId: uuid("tool_id")
    .notNull()
    .references(() => tools.id, { onDelete: "cascade" }),
  performedById: uuid("performed_by_id").references(() => users.id),
  maintenanceType: maintenanceTypeEnum("maintenance_type").notNull(),
  description: text("description").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  performedAt: timestamp("performed_at").defaultNow().notNull(),
  nextDueAt: timestamp("next_due_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reservations = pgTable("reservations", {
  id: uuid("id").defaultRandom().primaryKey(),
  toolId: uuid("tool_id")
    .notNull()
    .references(() => tools.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  locationId: uuid("location_id").references(() => locations.id),
  status: reservationStatusEnum("status").default("pending").notNull(),
  pickupDate: date("pickup_date").notNull(),
  pickupTime: time("pickup_time"),
  returnDate: date("return_date").notNull(),
  returnTime: time("return_time"),
  actualPickupDate: timestamp("actual_pickup_date"),
  actualReturnDate: timestamp("actual_return_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  difficulty: projectDifficultyEnum("difficulty"),
  estimatedTime: varchar("estimated_time", { length: 100 }),
  safetyNotes: jsonb("safety_notes"),
  stepOverview: jsonb("step_overview"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectTools = pgTable(
  "project_tools",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    toolId: uuid("tool_id")
      .notNull()
      .references(() => tools.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.projectId, table.toolId] })]
);

export const relatedProjects = pgTable(
  "related_projects",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    relatedProjectId: uuid("related_project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.projectId, table.relatedProjectId] })]
);

// ── New Tables ─────────────────────────────────────────────────────────

export const favorites = pgTable(
  "favorites",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    toolId: uuid("tool_id")
      .notNull()
      .references(() => tools.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.toolId] })]
);

export const savedProjects = pgTable(
  "saved_projects",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.projectId] })]
);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .primaryKey(),
  emailNotifications: boolean("email_notifications").default(true).notNull(),
  reminderDaysBefore: integer("reminder_days_before").default(2).notNull(),
  preferredLocationId: uuid("preferred_location_id").references(
    () => locations.id
  ),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Relations ──────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  memberProfile: one(memberProfiles, {
    fields: [users.id],
    references: [memberProfiles.userId],
  }),
  accounts: many(accounts),
  sessions: many(sessions),
  reservations: many(reservations),
  favorites: many(favorites),
  savedProjects: many(savedProjects),
  notifications: many(notifications),
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
  maintenanceRecords: many(toolMaintenanceRecords),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
  tools: many(tools),
  memberProfiles: many(memberProfiles),
  reservations: many(reservations),
}));

export const memberProfilesRelations = relations(
  memberProfiles,
  ({ one }) => ({
    user: one(users, {
      fields: [memberProfiles.userId],
      references: [users.id],
    }),
    preferredLocation: one(locations, {
      fields: [memberProfiles.preferredLocationId],
      references: [locations.id],
    }),
  })
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categoryParent",
  }),
  children: many(categories, { relationName: "categoryParent" }),
  tools: many(tools),
}));

export const toolsRelations = relations(tools, ({ one, many }) => ({
  category: one(categories, {
    fields: [tools.categoryId],
    references: [categories.id],
  }),
  location: one(locations, {
    fields: [tools.locationId],
    references: [locations.id],
  }),
  images: many(toolImages),
  accessories: many(toolAccessories),
  reservations: many(reservations),
  favorites: many(favorites),
  projectTools: many(projectTools),
  maintenanceRecords: many(toolMaintenanceRecords),
}));

export const toolImagesRelations = relations(toolImages, ({ one }) => ({
  tool: one(tools, { fields: [toolImages.toolId], references: [tools.id] }),
}));

export const toolAccessoriesRelations = relations(
  toolAccessories,
  ({ one }) => ({
    tool: one(tools, {
      fields: [toolAccessories.toolId],
      references: [tools.id],
    }),
  })
);

export const toolMaintenanceRecordsRelations = relations(
  toolMaintenanceRecords,
  ({ one }) => ({
    tool: one(tools, {
      fields: [toolMaintenanceRecords.toolId],
      references: [tools.id],
    }),
    performedBy: one(users, {
      fields: [toolMaintenanceRecords.performedById],
      references: [users.id],
    }),
  })
);

export const reservationsRelations = relations(reservations, ({ one }) => ({
  tool: one(tools, {
    fields: [reservations.toolId],
    references: [tools.id],
  }),
  user: one(users, {
    fields: [reservations.userId],
    references: [users.id],
  }),
  location: one(locations, {
    fields: [reservations.locationId],
    references: [locations.id],
  }),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  projectTools: many(projectTools),
  relatedFrom: many(relatedProjects, { relationName: "projectRelated" }),
  relatedTo: many(relatedProjects, { relationName: "relatedProject" }),
  savedBy: many(savedProjects),
}));

export const projectToolsRelations = relations(projectTools, ({ one }) => ({
  project: one(projects, {
    fields: [projectTools.projectId],
    references: [projects.id],
  }),
  tool: one(tools, {
    fields: [projectTools.toolId],
    references: [tools.id],
  }),
}));

export const relatedProjectsRelations = relations(
  relatedProjects,
  ({ one }) => ({
    project: one(projects, {
      fields: [relatedProjects.projectId],
      references: [projects.id],
      relationName: "projectRelated",
    }),
    relatedProject: one(projects, {
      fields: [relatedProjects.relatedProjectId],
      references: [projects.id],
      relationName: "relatedProject",
    }),
  })
);

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  tool: one(tools, { fields: [favorites.toolId], references: [tools.id] }),
}));

export const savedProjectsRelations = relations(savedProjects, ({ one }) => ({
  user: one(users, {
    fields: [savedProjects.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [savedProjects.projectId],
    references: [projects.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const userPreferencesRelations = relations(
  userPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [userPreferences.userId],
      references: [users.id],
    }),
    preferredLocation: one(locations, {
      fields: [userPreferences.preferredLocationId],
      references: [locations.id],
    }),
  })
);

// ── Type Exports ───────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
export type MemberProfile = typeof memberProfiles.$inferSelect;
export type NewMemberProfile = typeof memberProfiles.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Tool = typeof tools.$inferSelect;
export type NewTool = typeof tools.$inferInsert;
export type ToolImage = typeof toolImages.$inferSelect;
export type NewToolImage = typeof toolImages.$inferInsert;
export type ToolAccessory = typeof toolAccessories.$inferSelect;
export type NewToolAccessory = typeof toolAccessories.$inferInsert;
export type ToolMaintenanceRecord = typeof toolMaintenanceRecords.$inferSelect;
export type NewToolMaintenanceRecord = typeof toolMaintenanceRecords.$inferInsert;
export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;
export type SavedProject = typeof savedProjects.$inferSelect;
export type NewSavedProject = typeof savedProjects.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type UserPreference = typeof userPreferences.$inferSelect;
export type NewUserPreference = typeof userPreferences.$inferInsert;
// ─── Certification enums ──────────────────────────────────────────────────────

export const certificationTypeStatusEnum = pgEnum("certification_type_status", [
  "active",
  "inactive",
]);

export const memberCertificationStatusEnum = pgEnum("member_certification_status", [
  "valid",
  "expired",
  "revoked",
  "pending",
]);

// ─── Certification types ──────────────────────────────────────────────────────

export const certificationTypes = pgTable("certification_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  validityMonths: integer("validity_months"),
  isRequired: boolean("is_required").default(false).notNull(),
  status: certificationTypeStatusEnum("status").default("active").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Certification requirements ───────────────────────────────────────────────

export const certificationRequirements = pgTable("certification_requirements", {
  id: uuid("id").defaultRandom().primaryKey(),
  certificationTypeId: uuid("certification_type_id")
    .notNull()
    .references(() => certificationTypes.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "cascade",
  }),
  toolId: uuid("tool_id").references(() => tools.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Member certifications ────────────────────────────────────────────────────

export const memberCertifications = pgTable("member_certifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  certificationTypeId: uuid("certification_type_id")
    .notNull()
    .references(() => certificationTypes.id, { onDelete: "cascade" }),
  status: memberCertificationStatusEnum("status").default("pending").notNull(),
  issuedDate: date("issued_date"),
  expiryDate: date("expiry_date"),
  issuedById: uuid("issued_by_id").references(() => users.id),
  certificateNumber: varchar("certificate_number", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Certification relations ──────────────────────────────────────────────────

export const certificationTypesRelations = relations(
  certificationTypes,
  ({ many }) => ({
    requirements: many(certificationRequirements),
    memberCertifications: many(memberCertifications),
  })
);

export const certificationRequirementsRelations = relations(
  certificationRequirements,
  ({ one }) => ({
    certificationType: one(certificationTypes, {
      fields: [certificationRequirements.certificationTypeId],
      references: [certificationTypes.id],
    }),
    category: one(categories, {
      fields: [certificationRequirements.categoryId],
      references: [categories.id],
    }),
    tool: one(tools, {
      fields: [certificationRequirements.toolId],
      references: [tools.id],
    }),
  })
);

export const memberCertificationsRelations = relations(
  memberCertifications,
  ({ one }) => ({
    user: one(users, {
      fields: [memberCertifications.userId],
      references: [users.id],
    }),
    certificationType: one(certificationTypes, {
      fields: [memberCertifications.certificationTypeId],
      references: [certificationTypes.id],
    }),
    issuedBy: one(users, {
      fields: [memberCertifications.issuedById],
      references: [users.id],
    }),
  })
);

// ─── Certification type exports ───────────────────────────────────────────────

export type CertificationType = typeof certificationTypes.$inferSelect;
export type NewCertificationType = typeof certificationTypes.$inferInsert;
export type CertificationRequirement = typeof certificationRequirements.$inferSelect;
export type NewCertificationRequirement = typeof certificationRequirements.$inferInsert;
export type MemberCertification = typeof memberCertifications.$inferSelect;
export type NewMemberCertification = typeof memberCertifications.$inferInsert;
// ─── Inspection enums ─────────────────────────────────────────────────────────

export const inspectionTriggerTypeEnum = pgEnum("inspection_trigger_type", [
  "checkout",
  "checkin",
  "both",
  "manual",
]);

export const inspectionTemplateStatusEnum = pgEnum("inspection_template_status", [
  "active",
  "inactive",
]);

export const inspectionRunStatusEnum = pgEnum("inspection_run_status", [
  "in_progress",
  "passed",
  "failed",
  "flagged",
]);

export const inspectionItemResultEnum = pgEnum("inspection_item_result", [
  "pass",
  "fail",
  "na",
  "skipped",
]);

// ─── Inspection templates ─────────────────────────────────────────────────────

export const inspectionTemplates = pgTable("inspection_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  triggerType: inspectionTriggerTypeEnum("trigger_type")
    .default("both")
    .notNull(),
  status: inspectionTemplateStatusEnum("status").default("active").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Inspection template items ────────────────────────────────────────────────

export const inspectionTemplateItems = pgTable("inspection_template_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  templateId: uuid("template_id")
    .notNull()
    .references(() => inspectionTemplates.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 500 }).notNull(),
  description: text("description"),
  isCritical: boolean("is_critical").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Inspection runs ──────────────────────────────────────────────────────────

export const inspectionRuns = pgTable("inspection_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  templateId: uuid("template_id")
    .notNull()
    .references(() => inspectionTemplates.id),
  toolId: uuid("tool_id")
    .notNull()
    .references(() => tools.id),
  reservationId: uuid("reservation_id").references(() => reservations.id),
  performedById: uuid("performed_by_id")
    .notNull()
    .references(() => users.id),
  triggerType: inspectionTriggerTypeEnum("trigger_type").notNull(),
  status: inspectionRunStatusEnum("status").default("in_progress").notNull(),
  notes: text("notes"),
  flaggedForRepair: boolean("flagged_for_repair").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Inspection run items ─────────────────────────────────────────────────────

export const inspectionRunItems = pgTable("inspection_run_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  runId: uuid("run_id")
    .notNull()
    .references(() => inspectionRuns.id, { onDelete: "cascade" }),
  templateItemId: uuid("template_item_id")
    .notNull()
    .references(() => inspectionTemplateItems.id),
  result: inspectionItemResultEnum("result").default("skipped").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Inspection relations ─────────────────────────────────────────────────────

export const inspectionTemplatesRelations = relations(
  inspectionTemplates,
  ({ one, many }) => ({
    category: one(categories, {
      fields: [inspectionTemplates.categoryId],
      references: [categories.id],
    }),
    items: many(inspectionTemplateItems),
    runs: many(inspectionRuns),
  })
);

export const inspectionTemplateItemsRelations = relations(
  inspectionTemplateItems,
  ({ one }) => ({
    template: one(inspectionTemplates, {
      fields: [inspectionTemplateItems.templateId],
      references: [inspectionTemplates.id],
    }),
  })
);

export const inspectionRunsRelations = relations(
  inspectionRuns,
  ({ one, many }) => ({
    template: one(inspectionTemplates, {
      fields: [inspectionRuns.templateId],
      references: [inspectionTemplates.id],
    }),
    tool: one(tools, {
      fields: [inspectionRuns.toolId],
      references: [tools.id],
    }),
    reservation: one(reservations, {
      fields: [inspectionRuns.reservationId],
      references: [reservations.id],
    }),
    performedBy: one(users, {
      fields: [inspectionRuns.performedById],
      references: [users.id],
    }),
    items: many(inspectionRunItems),
  })
);

export const inspectionRunItemsRelations = relations(
  inspectionRunItems,
  ({ one }) => ({
    run: one(inspectionRuns, {
      fields: [inspectionRunItems.runId],
      references: [inspectionRuns.id],
    }),
    templateItem: one(inspectionTemplateItems, {
      fields: [inspectionRunItems.templateItemId],
      references: [inspectionTemplateItems.id],
    }),
  })
);

// ─── Inspection type exports ──────────────────────────────────────────────────

export type InspectionTemplate = typeof inspectionTemplates.$inferSelect;
export type NewInspectionTemplate = typeof inspectionTemplates.$inferInsert;
export type InspectionTemplateItem = typeof inspectionTemplateItems.$inferSelect;
export type NewInspectionTemplateItem = typeof inspectionTemplateItems.$inferInsert;
export type InspectionRun = typeof inspectionRuns.$inferSelect;
export type NewInspectionRun = typeof inspectionRuns.$inferInsert;
export type InspectionRunItem = typeof inspectionRunItems.$inferSelect;
export type NewInspectionRunItem = typeof inspectionRunItems.$inferInsert;
// ─── Maintenance schedule enums ───────────────────────────────────────────────

export const maintenanceScheduleStatusEnum = pgEnum("maintenance_schedule_status", [
  "active",
  "paused",
  "completed",
]);

export const maintenanceAssignmentStatusEnum = pgEnum("maintenance_assignment_status", [
  "pending",
  "in_progress",
  "completed",
  "skipped",
]);

// ─── Maintenance schedules ────────────────────────────────────────────────────

export const maintenanceSchedules = pgTable("maintenance_schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  toolId: uuid("tool_id")
    .notNull()
    .references(() => tools.id, { onDelete: "cascade" }),
  maintenanceType: maintenanceTypeEnum("maintenance_type")
    .default("routine")
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  intervalDays: integer("interval_days").default(90).notNull(),
  lastPerformedAt: timestamp("last_performed_at"),
  nextDueAt: timestamp("next_due_at").notNull(),
  status: maintenanceScheduleStatusEnum("status").default("active").notNull(),
  createdById: uuid("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Maintenance assignments ──────────────────────────────────────────────────

export const maintenanceAssignments = pgTable("maintenance_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  maintenanceRecordId: uuid("maintenance_record_id").references(
    () => toolMaintenanceRecords.id,
    { onDelete: "cascade" }
  ),
  scheduleId: uuid("schedule_id").references(() => maintenanceSchedules.id, {
    onDelete: "set null",
  }),
  assignedToId: uuid("assigned_to_id")
    .notNull()
    .references(() => users.id),
  status: maintenanceAssignmentStatusEnum("status")
    .default("pending")
    .notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Maintenance schedule relations ───────────────────────────────────────────

export const maintenanceSchedulesRelations = relations(
  maintenanceSchedules,
  ({ one, many }) => ({
    tool: one(tools, {
      fields: [maintenanceSchedules.toolId],
      references: [tools.id],
    }),
    createdBy: one(users, {
      fields: [maintenanceSchedules.createdById],
      references: [users.id],
    }),
    assignments: many(maintenanceAssignments),
  })
);

export const maintenanceAssignmentsRelations = relations(
  maintenanceAssignments,
  ({ one }) => ({
    maintenanceRecord: one(toolMaintenanceRecords, {
      fields: [maintenanceAssignments.maintenanceRecordId],
      references: [toolMaintenanceRecords.id],
    }),
    schedule: one(maintenanceSchedules, {
      fields: [maintenanceAssignments.scheduleId],
      references: [maintenanceSchedules.id],
    }),
    assignedTo: one(users, {
      fields: [maintenanceAssignments.assignedToId],
      references: [users.id],
    }),
  })
);

// ─── Maintenance type exports ─────────────────────────────────────────────────

export type MaintenanceSchedule = typeof maintenanceSchedules.$inferSelect;
export type NewMaintenanceSchedule = typeof maintenanceSchedules.$inferInsert;
export type MaintenanceAssignment = typeof maintenanceAssignments.$inferSelect;
export type NewMaintenanceAssignment = typeof maintenanceAssignments.$inferInsert;
// ─── Repair enums ─────────────────────────────────────────────────────────────

export const repairStatusEnum = pgEnum("repair_status", [
  "reported",
  "diagnosing",
  "in_repair",
  "waiting_parts",
  "completed",
  "unrepairable",
]);

export const repairPriorityEnum = pgEnum("repair_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

// ─── Repairs table ────────────────────────────────────────────────────────────

export const repairs = pgTable("repairs", {
  id: uuid("id").defaultRandom().primaryKey(),
  toolId: uuid("tool_id")
    .notNull()
    .references(() => tools.id),
  reportedById: uuid("reported_by_id")
    .notNull()
    .references(() => users.id),
  assignedToId: uuid("assigned_to_id").references(() => users.id),
  vendorName: varchar("vendor_name", { length: 255 }),
  status: repairStatusEnum("status").default("reported").notNull(),
  priority: repairPriorityEnum("priority").default("medium").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  diagnosis: text("diagnosis"),
  resolution: text("resolution"),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 10, scale: 2 }),
  estimatedCompletion: date("estimated_completion"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  inspectionRunId: uuid("inspection_run_id").references(() => inspectionRuns.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Repair parts ─────────────────────────────────────────────────────────────

export const repairParts = pgTable("repair_parts", {
  id: uuid("id").defaultRandom().primaryKey(),
  repairId: uuid("repair_id")
    .notNull()
    .references(() => repairs.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  partNumber: varchar("part_number", { length: 100 }),
  quantity: integer("quantity").default(1).notNull(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  vendor: varchar("vendor", { length: 255 }),
  isOrdered: boolean("is_ordered").default(false).notNull(),
  isReceived: boolean("is_received").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Repair notes ─────────────────────────────────────────────────────────────

export const repairNotes = pgTable("repair_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  repairId: uuid("repair_id")
    .notNull()
    .references(() => repairs.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  isStatusChange: boolean("is_status_change").default(false).notNull(),
  oldStatus: varchar("old_status", { length: 50 }),
  newStatus: varchar("new_status", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Repair relations ─────────────────────────────────────────────────────────

export const repairsRelations = relations(repairs, ({ one, many }) => ({
  tool: one(tools, { fields: [repairs.toolId], references: [tools.id] }),
  reportedBy: one(users, {
    fields: [repairs.reportedById],
    references: [users.id],
    relationName: "repairReporter",
  }),
  assignedTo: one(users, {
    fields: [repairs.assignedToId],
    references: [users.id],
    relationName: "repairAssignee",
  }),
  inspectionRun: one(inspectionRuns, {
    fields: [repairs.inspectionRunId],
    references: [inspectionRuns.id],
  }),
  parts: many(repairParts),
  notes: many(repairNotes),
}));

export const repairPartsRelations = relations(repairParts, ({ one }) => ({
  repair: one(repairs, {
    fields: [repairParts.repairId],
    references: [repairs.id],
  }),
}));

export const repairNotesRelations = relations(repairNotes, ({ one }) => ({
  repair: one(repairs, {
    fields: [repairNotes.repairId],
    references: [repairs.id],
  }),
  author: one(users, {
    fields: [repairNotes.authorId],
    references: [users.id],
  }),
}));

// ─── Repair type exports ──────────────────────────────────────────────────────

export type Repair = typeof repairs.$inferSelect;
export type NewRepair = typeof repairs.$inferInsert;
export type RepairPart = typeof repairParts.$inferSelect;
export type NewRepairPart = typeof repairParts.$inferInsert;
export type RepairNote = typeof repairNotes.$inferSelect;
export type NewRepairNote = typeof repairNotes.$inferInsert;
// ─── Issue enums ──────────────────────────────────────────────────────────────

export const issueStatusEnum = pgEnum("issue_status", [
  "new",
  "triaged",
  "assigned",
  "in_progress",
  "resolved",
  "closed",
]);

export const issueCategoryEnum = pgEnum("issue_category", [
  "damage",
  "malfunction",
  "missing_part",
  "safety",
  "cosmetic",
  "other",
]);

export const issuePriorityEnum = pgEnum("issue_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

// ─── Issues table ─────────────────────────────────────────────────────────────

export const issues = pgTable("issues", {
  id: uuid("id").defaultRandom().primaryKey(),
  toolId: uuid("tool_id").references(() => tools.id),
  reportedById: uuid("reported_by_id")
    .notNull()
    .references(() => users.id),
  assignedToId: uuid("assigned_to_id").references(() => users.id),
  repairId: uuid("repair_id").references(() => repairs.id),
  status: issueStatusEnum("status").default("new").notNull(),
  priority: issuePriorityEnum("priority").default("medium").notNull(),
  category: issueCategoryEnum("category").default("other").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Issue comments ───────────────────────────────────────────────────────────

export const issueComments = pgTable("issue_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  issueId: uuid("issue_id")
    .notNull()
    .references(() => issues.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  isStatusChange: boolean("is_status_change").default(false).notNull(),
  oldStatus: varchar("old_status", { length: 50 }),
  newStatus: varchar("new_status", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Issue relations ──────────────────────────────────────────────────────────

export const issuesRelations = relations(issues, ({ one, many }) => ({
  tool: one(tools, { fields: [issues.toolId], references: [tools.id] }),
  reportedBy: one(users, {
    fields: [issues.reportedById],
    references: [users.id],
    relationName: "issueReporter",
  }),
  assignedTo: one(users, {
    fields: [issues.assignedToId],
    references: [users.id],
    relationName: "issueAssignee",
  }),
  repair: one(repairs, {
    fields: [issues.repairId],
    references: [repairs.id],
  }),
  comments: many(issueComments),
}));

export const issueCommentsRelations = relations(issueComments, ({ one }) => ({
  issue: one(issues, {
    fields: [issueComments.issueId],
    references: [issues.id],
  }),
  author: one(users, {
    fields: [issueComments.authorId],
    references: [users.id],
  }),
}));

// ─── Issue type exports ───────────────────────────────────────────────────────

export type Issue = typeof issues.$inferSelect;
export type NewIssue = typeof issues.$inferInsert;
export type IssueComment = typeof issueComments.$inferSelect;
export type NewIssueComment = typeof issueComments.$inferInsert;
// ─── Partner enums ────────────────────────────────────────────────────────────

export const partnerTypeEnum = pgEnum("partner_type", [
  "supplier",
  "vendor",
  "sponsor",
  "manufacturer",
  "service_provider",
]);

export const partnerStatusEnum = pgEnum("partner_status", [
  "active",
  "inactive",
  "pending",
]);

// ─── Partners table ───────────────────────────────────────────────────────────

export const partners = pgTable("partners", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  type: partnerTypeEnum("type").default("vendor").notNull(),
  status: partnerStatusEnum("status").default("active").notNull(),
  description: text("description"),
  website: varchar("website", { length: 500 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 30 }),
  address: text("address"),
  city: varchar("city", { length: 255 }),
  state: varchar("state", { length: 100 }),
  zipCode: varchar("zip_code", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Partner contacts ─────────────────────────────────────────────────────────

export const partnerContacts = pgTable("partner_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  partnerId: uuid("partner_id")
    .notNull()
    .references(() => partners.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 30 }),
  isPrimary: boolean("is_primary").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Partner-tool links ───────────────────────────────────────────────────────

export const partnerToolLinks = pgTable("partner_tool_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  partnerId: uuid("partner_id")
    .notNull()
    .references(() => partners.id, { onDelete: "cascade" }),
  toolId: uuid("tool_id")
    .notNull()
    .references(() => tools.id, { onDelete: "cascade" }),
  relationship: varchar("relationship", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Partner-repair links ─────────────────────────────────────────────────────

export const partnerRepairLinks = pgTable("partner_repair_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  partnerId: uuid("partner_id")
    .notNull()
    .references(() => partners.id, { onDelete: "cascade" }),
  repairId: uuid("repair_id")
    .notNull()
    .references(() => repairs.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 100 }),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Partner relations ────────────────────────────────────────────────────────

export const partnersRelations = relations(partners, ({ many }) => ({
  contacts: many(partnerContacts),
  toolLinks: many(partnerToolLinks),
  repairLinks: many(partnerRepairLinks),
}));

export const partnerContactsRelations = relations(partnerContacts, ({ one }) => ({
  partner: one(partners, {
    fields: [partnerContacts.partnerId],
    references: [partners.id],
  }),
}));

export const partnerToolLinksRelations = relations(partnerToolLinks, ({ one }) => ({
  partner: one(partners, {
    fields: [partnerToolLinks.partnerId],
    references: [partners.id],
  }),
  tool: one(tools, {
    fields: [partnerToolLinks.toolId],
    references: [tools.id],
  }),
}));

export const partnerRepairLinksRelations = relations(partnerRepairLinks, ({ one }) => ({
  partner: one(partners, {
    fields: [partnerRepairLinks.partnerId],
    references: [partners.id],
  }),
  repair: one(repairs, {
    fields: [partnerRepairLinks.repairId],
    references: [repairs.id],
  }),
}));

// ─── Partner type exports ─────────────────────────────────────────────────────

export type Partner = typeof partners.$inferSelect;
export type NewPartner = typeof partners.$inferInsert;
export type PartnerContact = typeof partnerContacts.$inferSelect;
export type NewPartnerContact = typeof partnerContacts.$inferInsert;
export type PartnerToolLink = typeof partnerToolLinks.$inferSelect;
export type NewPartnerToolLink = typeof partnerToolLinks.$inferInsert;
export type PartnerRepairLink = typeof partnerRepairLinks.$inferSelect;
export type NewPartnerRepairLink = typeof partnerRepairLinks.$inferInsert;
// ─── Notification template/batch enums ────────────────────────────────────────

export const notificationTemplateStatusEnum = pgEnum("notification_template_status", [
  "active",
  "inactive",
]);

export const notificationBatchStatusEnum = pgEnum("notification_batch_status", [
  "draft",
  "sending",
  "sent",
  "failed",
]);

// ─── Notification templates ───────────────────────────────────────────────────

export const notificationTemplates = pgTable("notification_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  type: notificationTypeEnum("type").default("general").notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  variables: jsonb("variables"),
  status: notificationTemplateStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Notification batches ─────────────────────────────────────────────────────

export const notificationBatches = pgTable("notification_batches", {
  id: uuid("id").defaultRandom().primaryKey(),
  templateId: uuid("template_id").references(() => notificationTemplates.id),
  sentById: uuid("sent_by_id")
    .notNull()
    .references(() => users.id),
  type: notificationTypeEnum("type").default("general").notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  segment: varchar("segment", { length: 100 }),
  recipientCount: integer("recipient_count").default(0).notNull(),
  status: notificationBatchStatusEnum("status").default("draft").notNull(),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Notification template/batch relations ────────────────────────────────────

export const notificationTemplatesRelations = relations(
  notificationTemplates,
  ({ many }) => ({
    batches: many(notificationBatches),
  })
);

export const notificationBatchesRelations = relations(
  notificationBatches,
  ({ one }) => ({
    template: one(notificationTemplates, {
      fields: [notificationBatches.templateId],
      references: [notificationTemplates.id],
    }),
    sentBy: one(users, {
      fields: [notificationBatches.sentById],
      references: [users.id],
    }),
  })
);

// ─── Notification template/batch type exports ─────────────────────────────────

export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type NewNotificationTemplate = typeof notificationTemplates.$inferInsert;
export type NotificationBatch = typeof notificationBatches.$inferSelect;
export type NewNotificationBatch = typeof notificationBatches.$inferInsert;