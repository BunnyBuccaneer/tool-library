import { requireAdminAuth } from "@/lib/admin-auth";
import { getAllTools, getAllCategories, getAllLocations } from "@/lib/data/admin";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    category?: string;
    location?: string;
    search?: string;
  }>;
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "available":
      return "bg-green-100 text-green-700";
    case "checked_out":
      return "bg-blue-100 text-blue-700";
    case "reserved":
      return "bg-purple-100 text-purple-700";
    case "maintenance":
      return "bg-orange-100 text-orange-700";
    case "retired":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default async function AdminToolsPage({ searchParams }: PageProps) {
  await requireAdminAuth();
  const params = await searchParams;

  const [tools, categories, locations] = await Promise.all([
    getAllTools({
      status: params.status,
      category: params.category,
      location: params.location,
      search: params.search,
    }),
    getAllCategories(),
    getAllLocations(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tools</h1>
          <p className="text-sm text-slate-500 mt-1">
            {tools.length} {tools.length === 1 ? "tool" : "tools"} in inventory
          </p>
        </div>
        <Link
          href="/admin/tools/new"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Tool
        </Link>
      </div>

      {/* Filters */}
      <form className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            name="search"
            placeholder="Search tools..."
            defaultValue={params.search || ""}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            name="status"
            defaultValue={params.status || ""}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="checked_out">Checked Out</option>
            <option value="reserved">Reserved</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </select>
          <select
            name="category"
            defaultValue={params.category || ""}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            name="location"
            defaultValue={params.location || ""}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Apply Filters
          </button>
          <Link
            href="/admin/tools"
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Clear
          </Link>
        </div>
      </form>

      {/* Tools Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {tools.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-slate-500">No tools found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Tool</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Asset ID</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Category</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Location</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tools.map((tool) => (
                  <tr key={tool.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {tool.imageUrl ? (
                          <img
                            src={tool.imageUrl}
                            alt={tool.name}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-900">{tool.name}</p>
                          <p className="text-xs text-slate-500">
                            {tool.brand && tool.model
                              ? `${tool.brand} ${tool.model}`
                              : tool.brand || tool.model || "-"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-mono text-slate-600">{tool.assetId || "-"}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{tool.categoryName || "-"}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{tool.locationName || "-"}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeClass(tool.status)}`}>
                        {tool.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/tools/${tool.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
