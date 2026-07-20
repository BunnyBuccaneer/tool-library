import type { ReactNode } from "react";
import { clsx } from "clsx";

export type BadgeVariant =
  | "green"
  | "red"
  | "yellow"
  | "blue"
  | "purple"
  | "orange"
  | "slate"
  | "teal"
  | "pink";

const variantClasses: Record<BadgeVariant, string> = {
  green:  "bg-green-50  text-green-700  border-green-200",
  red:    "bg-red-50    text-red-700    border-red-200",
  yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
  blue:   "bg-blue-50   text-blue-700   border-blue-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  slate:  "bg-slate-50  text-slate-600  border-slate-200",
  teal:   "bg-teal-50   text-teal-700   border-teal-200",
  pink:   "bg-pink-50   text-pink-700   border-pink-200",
};

export interface StatusBadgeProps {
  variant?: BadgeVariant;
  label: string;
  dot?: boolean;
  className?: string;
  icon?: ReactNode;
}

export function StatusBadge({
  variant = "slate",
  label,
  dot = true,
  className,
  icon,
}: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {dot && !icon && (
        <span
          className={clsx("h-1.5 w-1.5 rounded-full", {
            "bg-green-500":  variant === "green",
            "bg-red-500":    variant === "red",
            "bg-yellow-500": variant === "yellow",
            "bg-blue-500":   variant === "blue",
            "bg-purple-500": variant === "purple",
            "bg-orange-500": variant === "orange",
            "bg-slate-400":  variant === "slate",
            "bg-teal-500":   variant === "teal",
            "bg-pink-500":   variant === "pink",
          })}
        />
      )}
      {icon && <span className="h-3 w-3">{icon}</span>}
      {label}
    </span>
  );
}

// ─── Preset helpers ───────────────────────────────────────────────────────────

export function toolStatusBadge(status: string) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    available:    { variant: "green",  label: "Available" },
    checked_out:  { variant: "blue",   label: "Checked Out" },
    reserved:     { variant: "yellow", label: "Reserved" },
    maintenance:  { variant: "orange", label: "Maintenance" },
    retired:      { variant: "slate",  label: "Retired" },
  };
  const cfg = map[status] ?? { variant: "slate", label: status };
  return <StatusBadge variant={cfg.variant} label={cfg.label} />;
}

export function reservationStatusBadge(status: string) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    pending:     { variant: "yellow", label: "Pending" },
    confirmed:   { variant: "blue",   label: "Confirmed" },
    checked_out: { variant: "purple", label: "Checked Out" },
    returned:    { variant: "green",  label: "Returned" },
    cancelled:   { variant: "slate",  label: "Cancelled" },
    overdue:     { variant: "red",    label: "Overdue" },
  };
  const cfg = map[status] ?? { variant: "slate", label: status };
  return <StatusBadge variant={cfg.variant} label={cfg.label} />;
}

export function memberStatusBadge(status: string) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    active:    { variant: "green",  label: "Active" },
    inactive:  { variant: "slate",  label: "Inactive" },
    suspended: { variant: "red",    label: "Suspended" },
    expired:   { variant: "orange", label: "Expired" },
    pending:   { variant: "yellow", label: "Pending" },
  };
  const cfg = map[status] ?? { variant: "slate", label: status };
  return <StatusBadge variant={cfg.variant} label={cfg.label} />;
}

export function userRoleBadge(role: string) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    super_admin: { variant: "purple", label: "Super Admin" },
    admin:       { variant: "blue",   label: "Admin" },
    manager:     { variant: "teal",   label: "Manager" },
    employee:    { variant: "green",  label: "Employee" },
    member:      { variant: "slate",  label: "Member" },
  };
  const cfg = map[role] ?? { variant: "slate", label: role };
  return <StatusBadge dot={false} variant={cfg.variant} label={cfg.label} />;
}

export function maintenanceTypeBadge(type: string) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    routine:     { variant: "green",  label: "Routine" },
    repair:      { variant: "red",    label: "Repair" },
    inspection:  { variant: "blue",   label: "Inspection" },
    calibration: { variant: "purple", label: "Calibration" },
    cleaning:    { variant: "teal",   label: "Cleaning" },
    replacement: { variant: "orange", label: "Replacement" },
    other:       { variant: "slate",  label: "Other" },
  };
  const cfg = map[type] ?? { variant: "slate", label: type };
  return <StatusBadge dot={false} variant={cfg.variant} label={cfg.label} />;
}