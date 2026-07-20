import { getDemoUserId } from "@/lib/auth-helpers";
import { getRentalHistory } from "@/lib/data/member";
import HistoryClient from "./HistoryClient";

export const dynamic = "force-dynamic";

export default async function HistoryPage(props: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const searchParams = await props.searchParams;
  const from = searchParams.from;
  const to = searchParams.to;

  let history: Awaited<ReturnType<typeof getRentalHistory>> = [];

  try {
    const userId = await getDemoUserId();
    history = await getRentalHistory(userId, from, to);
  } catch {
    // Demo user may not exist
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Rental History
      </h1>
      <HistoryClient history={history} initialFrom={from ?? ""} initialTo={to ?? ""} />
    </div>
  );
}
