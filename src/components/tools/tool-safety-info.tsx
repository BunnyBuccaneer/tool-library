import { ShieldAlert, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ToolSafetyInfoProps {
  safetyInfo: string | null;
}

export function ToolSafetyInfo({ safetyInfo }: ToolSafetyInfoProps) {
  if (!safetyInfo) return null;

  // Parse safety info into bullet points if it contains line breaks
  const points = safetyInfo.split("\n").filter((line) => line.trim());

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-slate-900">Safety Information</h3>
      </div>
      
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-amber-800">
            Please read all safety guidelines before using this tool.
          </p>
        </div>
        
        <ul className="space-y-2">
          {points.map((point, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-amber-900">
              <CheckCircle2 className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>{point.replace(/^[-•*]\s*/, "")}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
