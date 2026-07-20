"use client";

import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string; count?: number }[];
  allLabel?: string;
}

export function Select({
  label,
  options,
  allLabel = "All",
  className,
  ...props
}: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        className={cn(
          "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900",
          "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none",
          "transition-colors",
          className
        )}
        {...props}
      >
        <option value="all">{allLabel}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
            {opt.count !== undefined ? ` (${opt.count})` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
