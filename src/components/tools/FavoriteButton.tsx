"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

interface FavoriteButtonProps {
  toolId: string;
  initialFavorited?: boolean;
  onToggle?: (favorited: boolean) => void;
  size?: "sm" | "md" | "lg";
}

export default function FavoriteButton({
  toolId,
  initialFavorited = false,
  onToggle,
  size = "md",
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

  const sizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const padding = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-2.5",
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-lg ${padding[size]} transition-colors ${
        favorited
          ? "text-red-500 hover:bg-red-50"
          : "text-slate-400 hover:bg-slate-100 hover:text-red-400"
      } ${loading ? "opacity-50 cursor-wait" : ""}`}
      title={favorited ? "Remove from favorites" : "Add to favorites"}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={sizes[size]}
        fill={favorited ? "currentColor" : "none"}
        strokeWidth={2}
      />
    </button>
  );
}