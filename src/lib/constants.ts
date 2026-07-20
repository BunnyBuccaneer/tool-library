export const ITEMS_PER_PAGE = 12;

export const SKILL_LEVELS = [
  { value: "beginner", label: "Beginner", color: "bg-green-100 text-green-800" },
  { value: "intermediate", label: "Intermediate", color: "bg-yellow-100 text-yellow-800" },
  { value: "advanced", label: "Advanced", color: "bg-orange-100 text-orange-800" },
  { value: "professional", label: "Professional", color: "bg-red-100 text-red-800" },
] as const;

export const TOOL_STATUSES = [
  { value: "available", label: "Available", color: "bg-green-100 text-green-800" },
  { value: "checked_out", label: "Checked Out", color: "bg-blue-100 text-blue-800" },
  { value: "reserved", label: "Reserved", color: "bg-purple-100 text-purple-800" },
  { value: "maintenance", label: "Maintenance", color: "bg-yellow-100 text-yellow-800" },
  { value: "retired", label: "Retired", color: "bg-gray-100 text-gray-800" },
] as const;

export const SORT_OPTIONS = [
  { value: "name_asc", label: "Name (A–Z)" },
  { value: "name_desc", label: "Name (Z–A)" },
  { value: "brand_asc", label: "Brand (A–Z)" },
  { value: "brand_desc", label: "Brand (Z–A)" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
] as const;
