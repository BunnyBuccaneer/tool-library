import { Ruler, Zap, Weight, Gauge, Box, Settings } from "lucide-react";

interface ToolSpecificationsProps {
  specifications: Record<string, string> | null;
}

const SPEC_ICONS: Record<string, React.ReactNode> = {
  weight: <Weight className="h-4 w-4" />,
  power: <Zap className="h-4 w-4" />,
  dimensions: <Ruler className="h-4 w-4" />,
  speed: <Gauge className="h-4 w-4" />,
  capacity: <Box className="h-4 w-4" />,
  default: <Settings className="h-4 w-4" />,
};

function getIconForSpec(key: string): React.ReactNode {
  const normalizedKey = key.toLowerCase();
  if (normalizedKey.includes("weight")) return SPEC_ICONS.weight;
  if (normalizedKey.includes("power") || normalizedKey.includes("watt") || normalizedKey.includes("volt")) return SPEC_ICONS.power;
  if (normalizedKey.includes("dimension") || normalizedKey.includes("size") || normalizedKey.includes("length")) return SPEC_ICONS.dimensions;
  if (normalizedKey.includes("speed") || normalizedKey.includes("rpm")) return SPEC_ICONS.speed;
  if (normalizedKey.includes("capacity") || normalizedKey.includes("depth")) return SPEC_ICONS.capacity;
  return SPEC_ICONS.default;
}

export function ToolSpecifications({ specifications }: ToolSpecificationsProps) {
  if (!specifications || Object.keys(specifications).length === 0) {
    return null;
  }

  const entries = Object.entries(specifications);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Specifications</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-500">
              {getIconForSpec(key)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
                {key}
              </p>
              <p className="text-sm font-semibold text-slate-900 truncate">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
