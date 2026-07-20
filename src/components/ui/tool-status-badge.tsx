interface ToolStatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  available: {
    label: "Available",
    className: "bg-emerald-100 text-emerald-800",
  },
  checked_out: {
    label: "Checked Out",
    className: "bg-slate-100 text-slate-800",
  },
  reserved: {
    label: "Reserved",
    className: "bg-blue-100 text-blue-800",
  },
  maintenance: {
    label: "Maintenance",
    className: "bg-amber-100 text-amber-800",
  },
  retired: {
    label: "Retired",
    className: "bg-rose-100 text-rose-800",
  },
};

export function ToolStatusBadge({ status }: ToolStatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    className: "bg-slate-100 text-slate-800",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
