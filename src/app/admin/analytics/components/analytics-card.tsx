import type { ReactNode } from "react";
import { clsx } from "clsx";

interface AnalyticsCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function AnalyticsCard({ title, subtitle, children, className }: AnalyticsCardProps) {
  return (
    <div className={clsx("rounded-xl border border-slate-200 bg-white p-6", className)}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

interface MetricProps {
  label: string;
  value: string | number;
  change?: string;
  color?: "green" | "red" | "yellow" | "blue" | "slate";
}

export function Metric({ label, value, change, color = "slate" }: MetricProps) {
  const vc = color === "green" ? "text-green-600" : color === "red" ? "text-red-600" : color === "yellow" ? "text-yellow-600" : color === "blue" ? "text-blue-600" : "text-slate-900";
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-2xl font-bold ${vc}`}>{value}</p>
      {change && <p className="text-xs text-slate-500">{change}</p>}
    </div>
  );
}

interface BarItemProps {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
  suffix?: string;
}

export function HorizontalBar({ label, value, maxValue, color = "bg-blue-500", suffix = "" }: BarItemProps) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 flex-shrink-0 truncate text-sm text-slate-700">{label}</span>
      <div className="flex-1">
        <div className="h-5 w-full rounded-full bg-slate-100">
          <div className={`h-5 rounded-full ${color} transition-all`} style={{ width: `${Math.max(pct, 1)}%` }} />
        </div>
      </div>
      <span className="w-16 flex-shrink-0 text-right text-sm font-medium text-slate-900">
        {value}{suffix}
      </span>
    </div>
  );
}