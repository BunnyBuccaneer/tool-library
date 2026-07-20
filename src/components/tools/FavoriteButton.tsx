"use client";

import { useState } from "react";

interface FavoriteButtonProps {
  toolId: string;
  initialFavorited?: boolean;
  onToggle?: (favorited: boolean) => void;
}

export default function FavoriteButton({
  toolId,
  initialFavorited = false,
  onToggle,
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId }),
      });
      const data = await res.json();
      setFavorited(data.favorited);
      onToggle?.(data.favorited);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-lg p-2 text-lg transition-colors ${
        favorited
          ? "text-red-500 hover:text-red-600"
          : "text-slate-300 hover:text-red-400"
      } ${loading ? "opacity-50" : ""}`}
      title={favorited ? "Remove from favorites" : "Add to favorites"}
    >
      {favorited ? "❤️" : "🤍"}
    </button>
  );
}
