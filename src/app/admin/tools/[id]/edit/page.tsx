import { requireAdminAuth } from "@/lib/admin-auth";
import { getToolById, getAllCategories, getAllLocations } from "@/lib/data/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import ToolEditForm from "./ToolEditForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ToolEditPage({ params }: PageProps) {
  await requireAdminAuth();
  const { id } = await params;

  const [tool, categories, locations] = await Promise.all([
    getToolById(id),
    getAllCategories(),
    getAllLocations(),
  ]);

  if (!tool) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/tools" className="text-slate-500 hover:text-slate-700">
          Tools
        </Link>
        <span className="text-slate-300">/</span>
        <Link href={`/admin/tools/${tool.id}`} className="text-slate-500 hover:text-slate-700">
          {tool.name}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-medium">Edit</span>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Edit Tool</h1>
        <p className="text-sm text-slate-500 mt-1">Update tool information and settings</p>
      </div>

      {/* Edit Form */}
      <ToolEditForm tool={tool} categories={categories} locations={locations} />
    </div>
  );
}
