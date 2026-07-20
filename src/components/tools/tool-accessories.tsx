import { Package, Check, X } from "lucide-react";
import type { ToolAccessory } from "@/db/schema";

interface ToolAccessoriesProps {
  accessories: ToolAccessory[];
}

export function ToolAccessories({ accessories }: ToolAccessoriesProps) {
  if (accessories.length === 0) return null;

  const included = accessories.filter((a) => a.isIncluded);
  const optional = accessories.filter((a) => !a.isIncluded);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-slate-900">Included Accessories</h3>
      </div>

      {included.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-3">
            Included with this tool
          </p>
          <ul className="space-y-2">
            {included.map((accessory) => (
              <li key={accessory.id} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">{accessory.name}</p>
                  {accessory.description && (
                    <p className="text-xs text-green-700">{accessory.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {optional.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
            Optional / Not included
          </p>
          <ul className="space-y-2">
            {optional.map((accessory) => (
              <li key={accessory.id} className="flex items-start gap-2">
                <X className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-700">{accessory.name}</p>
                  {accessory.description && (
                    <p className="text-xs text-slate-500">{accessory.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
