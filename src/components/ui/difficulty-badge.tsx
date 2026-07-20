interface DifficultyBadgeProps {
  difficulty: "beginner" | "intermediate" | "advanced" | "expert" | null;
  size?: "sm" | "md";
}

const difficultyConfig = {
  beginner: {
    label: "Beginner",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  intermediate: {
    label: "Intermediate",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  advanced: {
    label: "Advanced",
    className: "bg-rose-100 text-rose-800 border-rose-200",
  },
  expert: {
    label: "Expert",
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
};

export function DifficultyBadge({ difficulty, size = "md" }: DifficultyBadgeProps) {
  const config = difficultyConfig[difficulty ?? "beginner"];
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${config.className} ${sizeClasses}`}
    >
      {config.label}
    </span>
  );
}