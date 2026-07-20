import { getDemoUserId } from "@/lib/auth-helpers";
import { getMembership } from "@/lib/data/member";

export const dynamic = "force-dynamic";

export default async function MembershipPage() {
  let membership: Awaited<ReturnType<typeof getMembership>> | null = null;

  try {
    const userId = await getDemoUserId();
    membership = await getMembership(userId);
  } catch {
    // Demo user may not exist
  }

  if (!membership) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Membership</h1>
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No membership profile found.
        </div>
      </div>
    );
  }

  const { profile, location } = membership;

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-slate-100 text-slate-600",
    suspended: "bg-red-100 text-red-700",
    expired: "bg-yellow-100 text-yellow-700",
    pending: "bg-blue-100 text-blue-700",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Membership</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-medium text-slate-500 mb-1">
              Member Number
            </h2>
            <p className="text-lg font-mono font-bold text-slate-900">
              {profile.memberNumber}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-medium text-slate-500 mb-1">Status</h2>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                statusColors[profile.membershipStatus] ??
                "bg-slate-100 text-slate-600"
              }`}
            >
              {profile.membershipStatus}
            </span>
          </div>

          <div>
            <h2 className="text-sm font-medium text-slate-500 mb-1">
              Join Date
            </h2>
            <p className="text-slate-900">{profile.joinDate}</p>
          </div>

          <div>
            <h2 className="text-sm font-medium text-slate-500 mb-1">
              Expiration Date
            </h2>
            <p className="text-slate-900">
              {profile.expirationDate ?? "N/A"}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-medium text-slate-500 mb-1">
              Preferred Location
            </h2>
            <p className="text-slate-900">
              {location?.name ?? "Not set"}
            </p>
          </div>

          {profile.phone && (
            <div>
              <h2 className="text-sm font-medium text-slate-500 mb-1">
                Phone
              </h2>
              <p className="text-slate-900">{profile.phone}</p>
            </div>
          )}
        </div>

        {profile.address && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h2 className="text-sm font-medium text-slate-500 mb-1">
              Address
            </h2>
            <p className="text-slate-900">
              {profile.address}
              {profile.city && `, ${profile.city}`}
              {profile.state && `, ${profile.state}`}
              {profile.zipCode && ` ${profile.zipCode}`}
            </p>
          </div>
        )}

        {profile.membershipStatus === "active" && profile.expirationDate && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <button className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
              Renew Membership
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
