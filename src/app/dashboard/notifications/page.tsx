import { getDemoUserId } from "@/lib/auth-helpers";
import { getNotifications } from "@/lib/data/member";
import NotificationsClient from "./NotificationsClient";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  let notifs: Awaited<ReturnType<typeof getNotifications>> = [];

  try {
    const userId = await getDemoUserId();
    notifs = await getNotifications(userId);
  } catch {
    // Demo user may not exist
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Notifications</h1>
      <NotificationsClient notifications={notifs} />
    </div>
  );
}
