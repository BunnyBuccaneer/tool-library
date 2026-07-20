import type { ReactNode } from "react";
import { clsx } from "clsx";
import { Inbox } from "lucide-react";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      <p className="mb-1 text-base font-semibold text-slate-700">{title}</p>
      {description && (
        <p className="mb-4 max-w-sm text-sm text-slate-500">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}