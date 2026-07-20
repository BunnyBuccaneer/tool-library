import { getDemoUserId } from "@/lib/auth-helpers";
import { getUpcomingReservations } from "@/lib/data/member";
import ReservationsClient from "./ReservationsClient";

export const dynamic = "force-dynamic";

export default async function ReservationsPage() {
  let reservations: Awaited<ReturnType<typeof getUpcomingReservations>> = [];

  try {
    const userId = await getDemoUserId();
    reservations = await getUpcomingReservations(userId);
  } catch {
    // Demo user may not exist
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Upcoming Reservations
      </h1>
      {reservations.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No upcoming reservations.
        </div>
      ) : (
        <ReservationsClient reservations={reservations} />
      )}
    </div>
  );
}
