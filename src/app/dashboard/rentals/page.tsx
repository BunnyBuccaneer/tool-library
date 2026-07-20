import { getDemoUserId } from "@/lib/auth-helpers";
import { getCurrentRentals } from "@/lib/data/member";
import RentalsClient from "./RentalsClient";

export const dynamic = "force-dynamic";

export default async function RentalsPage() {
  let rentals: Awaited<ReturnType<typeof getCurrentRentals>> = [];

  try {
    const userId = await getDemoUserId();
    rentals = await getCurrentRentals(userId);
  } catch {
    // Demo user may not exist
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Current Rentals
      </h1>
      {rentals.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No tools currently checked out.
        </div>
      ) : (
        <RentalsClient rentals={rentals} />
      )}
    </div>
  );
}
