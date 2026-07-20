/**
 * Role-based access control (RBAC) system.
 *
 * Roles are hierarchical:
 *   super_admin > admin > manager > employee > member
 *
 * Permissions are additive — higher roles inherit all lower role permissions
 * conceptually, but each permission independently declares which roles hold it
 * via the PERMISSIONS matrix below.
 */

// ── Roles ──────────────────────────────────────────────────────────────

export const ROLES = [
  "super_admin",
  "admin",
  "manager",
  "employee",
  "member",
] as const;

export type Role = (typeof ROLES)[number];

/**
 * Human-readable role labels.
 */
export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  employee: "Employee",
  member: "Member",
};

// ── Permissions ────────────────────────────────────────────────────────

/**
 * Permission matrix — maps each permission to the roles that hold it.
 * Extend this as features are added.
 */
export const PERMISSIONS = {
  // Dashboard
  "dashboard:view": ["member", "employee", "manager", "admin", "super_admin"],

  // Members
  "members:view": ["employee", "manager", "admin", "super_admin"],
  "members:create": ["manager", "admin", "super_admin"],
  "members:edit": ["manager", "admin", "super_admin"],
  "members:delete": ["admin", "super_admin"],

  // Tools
  "tools:view": ["member", "employee", "manager", "admin", "super_admin"],
  "tools:create": ["manager", "admin", "super_admin"],
  "tools:edit": ["employee", "manager", "admin", "super_admin"],
  "tools:delete": ["admin", "super_admin"],

  // Categories
  "categories:view": ["employee", "manager", "admin", "super_admin"],
  "categories:manage": ["manager", "admin", "super_admin"],

  // Reservations
  "reservations:view_own": [
    "member",
    "employee",
    "manager",
    "admin",
    "super_admin",
  ],
  "reservations:view_all": ["employee", "manager", "admin", "super_admin"],
  "reservations:create": [
    "member",
    "employee",
    "manager",
    "admin",
    "super_admin",
  ],
  "reservations:manage": ["employee", "manager", "admin", "super_admin"],

  // Maintenance
  "maintenance:view": ["employee", "manager", "admin", "super_admin"],
  "maintenance:manage": ["employee", "manager", "admin", "super_admin"],

  // Locations
  "locations:view": ["employee", "manager", "admin", "super_admin"],
  "locations:manage": ["admin", "super_admin"],

  // Users / Staff
  "users:view": ["admin", "super_admin"],
  "users:manage": ["admin", "super_admin"],
  "users:assign_roles": ["super_admin"],
  "users:impersonate": ["super_admin"],

  // Settings
  "settings:view": ["admin", "super_admin"],
  "settings:manage": ["super_admin"],

  // Reports
  "reports:view": ["manager", "admin", "super_admin"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

// ── Role Hierarchy ─────────────────────────────────────────────────────

/**
 * Numeric level per role — higher value means more privileges.
 */
const ROLE_LEVELS: Record<Role, number> = {
  member: 0,
  employee: 1,
  manager: 2,
  admin: 3,
  super_admin: 4,
};

// ── Permission Helpers ─────────────────────────────────────────────────

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return (allowedRoles as readonly string[]).includes(role);
}

/**
 * Check if a role has ALL of the specified permissions.
 */
export function hasAllPermissions(
  role: Role,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Check if a role has ANY of the specified permissions.
 */
export function hasAnyPermission(
  role: Role,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Get all permissions granted to a role.
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return (Object.keys(PERMISSIONS) as Permission[]).filter((permission) =>
    hasPermission(role, permission)
  );
}

// ── Role Hierarchy Helpers ─────────────────────────────────────────────

/**
 * Check if roleA is at least as privileged as roleB.
 */
export function isAtLeast(roleA: Role, roleB: Role): boolean {
  return ROLE_LEVELS[roleA] >= ROLE_LEVELS[roleB];
}

/**
 * Compare two roles. Returns:
 *   positive  — if role1 is more privileged than role2
 *   zero      — if they are equal
 *   negative  — if role1 is less privileged than role2
 */
export function compareRoles(role1: Role, role2: Role): number {
  return ROLE_LEVELS[role1] - ROLE_LEVELS[role2];
}

/**
 * Check if a role can access the admin area.
 * Equivalent to checking the employee level and above.
 */
export function isAdminRole(role: Role): boolean {
  return isAtLeast(role, "employee");
}