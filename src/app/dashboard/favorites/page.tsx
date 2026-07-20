import { getDemoUserId } from "@/lib/auth-helpers";
import { getFavoriteTools } from "@/lib/data/member";
import FavoritesClient from "./FavoritesClient";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  let favorites: Awaited<ReturnType<typeof getFavoriteTools>> = [];

  try {
    const userId = await getDemoUserId();
    favorites = await getFavoriteTools(userId);
  } catch {
    // Demo user may not exist
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Favorite Tools
      </h1>
      {favorites.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No favorite tools yet. Browse tools and click the heart to save them!
        </div>
      ) : (
        <FavoritesClient favorites={favorites} />
      )}
    </div>
  );
}
