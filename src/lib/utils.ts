export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function buildQueryString(
  params: Record<string, string | undefined>,
  base: Record<string, string | undefined> = {}
): string {
  const merged = { ...base, ...params };
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value && value !== "" && value !== "all") {
      searchParams.set(key, value);
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getSkillLevelColor(level: string): string {
  switch (level) {
    case "beginner":
      return "bg-green-100 text-green-800";
    case "intermediate":
      return "bg-yellow-100 text-yellow-800";
    case "advanced":
      return "bg-orange-100 text-orange-800";
    case "professional":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "available":
      return "bg-green-100 text-green-800";
    case "checked_out":
      return "bg-blue-100 text-blue-800";
    case "reserved":
      return "bg-purple-100 text-purple-800";
    case "maintenance":
      return "bg-yellow-100 text-yellow-800";
    case "retired":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function formatStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatSkillLevel(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}
export function getInitials(name?: string | null): string {
  if (!name) return "U"; // "U" for Unknown if no name is provided
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}