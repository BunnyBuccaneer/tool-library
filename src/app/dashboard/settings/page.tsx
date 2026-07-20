import { getDemoUserId } from "@/lib/auth-helpers";
import { getMemberProfile, getUserPreferences } from "@/lib/data/member";
import { db } from "@/db";
import { users, locations } from "@/db/schema";
import { eq } from "drizzle-orm";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let userData = {
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    preferredLocationId: "",
  };
  let prefsData = {
    emailNotifications: true,
    reminderDaysBefore: 2,
    preferredLocationId: "",
  };
  let allLocations: { id: string; name: string }[] = [];

  try {
    const userId = await getDemoUserId();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const profile = await getMemberProfile(userId);
    const prefs = await getUserPreferences(userId);

    const locs = await db
      .select({ id: locations.id, name: locations.name })
      .from(locations);
    allLocations = locs;

    if (user) {
      userData.name = user.name ?? "";
      userData.email = user.email;
    }
    if (profile) {
      userData.phone = profile.phone ?? "";
      userData.address = profile.address ?? "";
      userData.city = profile.city ?? "";
      userData.state = profile.state ?? "";
      userData.zipCode = profile.zipCode ?? "";
      userData.preferredLocationId = profile.preferredLocationId ?? "";
    }
    if (prefs) {
      prefsData.emailNotifications = prefs.emailNotifications;
      prefsData.reminderDaysBefore = prefs.reminderDaysBefore;
      prefsData.preferredLocationId = prefs.preferredLocationId ?? "";
    }
  } catch {
    // Demo user may not exist
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>
      <SettingsClient
        initialProfile={userData}
        initialPrefs={prefsData}
        locations={allLocations}
      />
    </div>
  );
}
