import type { Tool, Category, Location, ToolImage, ToolAccessory, Reservation } from "@/db/schema";

export interface ToolWithRelations extends Tool {
  category: Category;
  location: Location | null;
}

export interface ToolDetailData extends Tool {
  category: Category;
  location: Location | null;
  images: ToolImage[];
  accessories: ToolAccessory[];
}

export interface ReservationWithRelations extends Reservation {
  tool: Tool;
  user: { id: string; name: string | null; email: string };
  location: Location | null;
}

export interface CatalogSearchParams {
  search?: string;
  category?: string;
  status?: string;
  skillLevel?: string;
  brand?: string;
  location?: string;
  sort?: string;
  page?: string;
  view?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CatalogFilters {
  categories: { id: string; name: string; slug: string; count: number }[];
  brands: { name: string; count: number }[];
  statuses: { value: string; count: number }[];
  skillLevels: { value: string; count: number }[];
  locations: { id: string; name: string; count: number }[];
}

export interface CatalogData {
  tools: ToolWithRelations[];
  pagination: PaginationInfo;
  filters: CatalogFilters;
}

export interface DateRange {
  from: Date;
  to: Date;
}
