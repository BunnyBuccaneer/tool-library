import { ToolCardGrid } from "@/components/tools/tool-card-grid";
import { ToolCardList } from "@/components/tools/tool-card-list";
import type { ToolWithRelations } from "@/lib/types";

interface ToolGridProps {
  tools: ToolWithRelations[];
  view: "grid" | "list";
}

export function ToolGrid({ tools, view }: ToolGridProps) {
  if (view === "list") {
    return (
      <div className="flex flex-col gap-3">
        {tools.map((tool) => (
          <ToolCardList key={tool.id} tool={tool} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tools.map((tool) => (
        <ToolCardGrid key={tool.id} tool={tool} />
      ))}
    </div>
  );
}
