import { requireAdminAuth } from "@/lib/admin-auth";
import { getReservationFilterLocations } from "@/lib/data/reservations";
import { getMembersForDropdown } from "@/lib/data/certifications";
import { db } from "@/db";
import { tools } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import Link from "next/link";
import { PageHeader, Breadcrumb } from "@/components/admin/page-header";
import ReservationCreateForm from "./ReservationCreateForm";

export const dynamic = "force-dynamic";

export default async function NewReservationPage() {
  await requireAdminAuth();

  const [members, locations, toolsList] = await Promise.all([
    getMembersForDropdown(),
    getReservationFilterLocations(),
    db
      .select({
        id: tools.id,
        name: tools.name,
        assetId: tools.assetId,
        status: tools.status,
      })
      .from(tools)
      .where(eq(tools.isActive, true))
      .orderBy(asc(tools.name)),
  ]);

  return (
    <div>
      <PageHeader
        title="New Reservation"
        description="Create a reservation on behalf of a member."
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Admin", href: "/admin" },
              { label: "Reservations", href: "/admin/reservations" },
              { label: "New" },
            ]}
          />
        }
        actions={
          <Link
            href="/admin/reservations"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            ← Back to Reservations
          </Link>
        }
      />

      <ReservationCreateForm
        members={members}
        locations={locations}
        tools={toolsList}
      />
    </div>
  );
}