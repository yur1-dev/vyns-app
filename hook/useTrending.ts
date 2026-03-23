// hooks/useTrending.ts
import { useEffect, useState } from "react";

interface TrendingEntry {
  keyword: string;
  matchedUsernames: string[];
  category: string;
  duration: string;
  yieldBoost: number;
  priceFloorMultiplier: number;
  expiresAt: string;
}

export function useTrending() {
  const [trendingMap, setTrendingMap] = useState<Record<string, TrendingEntry>>(
    {},
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trending")
      .then((r) => r.json())
      .then((data) => {
        if (!data.trending) return;
        const map: Record<string, TrendingEntry> = {};
        for (const entry of data.trending) {
          for (const username of entry.matchedUsernames) {
            const clean = username.replace(/^@/, "").toLowerCase();
            map[clean] = entry;
          }
        }
        setTrendingMap(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function getTrending(username: string): TrendingEntry | null {
    const clean = username.replace(/^@/, "").toLowerCase();
    return trendingMap[clean] ?? null;
  }

  return { trendingMap, getTrending, loading };
}
