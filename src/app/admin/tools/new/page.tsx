import { requireAdminAuth } from "@/lib/admin-auth";
import { getAllCategories, getAllLocations } from "@/lib/data/admin";
import Link from "next/link";
import ToolCreateForm from "./ToolCreateForm";

export default async function NewToolPage() {
  await requireAdminAuth();

  const [categories, locations] = await Promise.all([
    getAllCategories(),
    getAllLocations(),
  ]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/tools" className="text-slate-500 hover:text-slate-700">
          Tools
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-medium">New</span>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add New Tool</h1>
        <p className="text-sm text-slate-500 mt-1">
          Create a new tool in the inventory.
        </p>
      </div>

      {/* Create Form */}
      <ToolCreateForm categories={categories} locations={locations} />
    </div>
  );
}