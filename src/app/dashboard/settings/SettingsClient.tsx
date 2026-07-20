"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/dashboard/Toast";

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  preferredLocationId: string;
}

interface PrefsData {
  emailNotifications: boolean;
  reminderDaysBefore: number;
  preferredLocationId: string;
}

interface Props {
  initialProfile: ProfileData;
  initialPrefs: PrefsData;
  locations: { id: string; name: string }[];
}

export default function SettingsClient({
  initialProfile,
  initialPrefs,
  locations,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState(initialProfile);
  const [prefs, setPrefs] = useState(initialPrefs);
  const [profileLoading, setProfileLoading] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(false);

  const saveProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      toast("Profile saved!", "success");
      router.refresh();
    } catch {
      toast("Failed to save profile", "error");
    } finally {
      setProfileLoading(false);
    }
  };

  const savePrefs = async () => {
    setPrefsLoading(true);
    try {
      const res = await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error("Failed to save preferences");
      toast("Preferences saved!", "success");
      router.refresh();
    } catch {
      toast("Failed to save preferences", "error");
    } finally {
      setPrefsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Name
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) =>
                setProfile((p) => ({ ...p, name: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Email
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) =>
                setProfile((p) => ({ ...p, email: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) =>
                setProfile((p) => ({ ...p, phone: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Preferred Location
            </label>
            <select
              value={profile.preferredLocationId}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  preferredLocationId: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">None</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Address
            </label>
            <input
              type="text"
              value={profile.address}
              onChange={(e) =>
                setProfile((p) => ({ ...p, address: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              City
            </label>
            <input
              type="text"
              value={profile.city}
              onChange={(e) =>
                setProfile((p) => ({ ...p, city: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                State
              </label>
              <input
                type="text"
                value={profile.state}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, state: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                ZIP
              </label>
              <input
                type="text"
                value={profile.zipCode}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, zipCode: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={saveProfile}
            disabled={profileLoading}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {profileLoading ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Notification Preferences
        </h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={prefs.emailNotifications}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  emailNotifications: e.target.checked,
                }))
              }
              className="rounded border-slate-300 h-4 w-4"
            />
            <span className="text-sm text-slate-700">
              Email notifications
            </span>
          </label>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Reminder (days before)
            </label>
            <select
              value={prefs.reminderDaysBefore}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  reminderDaysBefore: parseInt(e.target.value),
                }))
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {[1, 2, 3, 5, 7].map((d) => (
                <option key={d} value={d}>
                  {d} day{d !== 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Preferred Location
            </label>
            <select
              value={prefs.preferredLocationId}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  preferredLocationId: e.target.value,
                }))
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">None</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={savePrefs}
            disabled={prefsLoading}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {prefsLoading ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}
