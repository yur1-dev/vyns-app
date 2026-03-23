// app/api/cron/trending-sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import { Username } from "@/models";
import { Trending } from "@/models/trending";

const MONTHLY_KEYWORDS = [
  "taylor",
  "swift",
  "beyonce",
  "elon",
  "musk",
  "trump",
  "biden",
  "ronaldo",
  "messi",
  "lebron",
  "drake",
  "rihanna",
  "kanye",
  "ye",
  "superbowl",
  "worldcup",
  "olympics",
  "oscars",
  "grammy",
];
const MEME_CATEGORIES = ["meme", "viral"];

function classifyDuration(
  keyword: string,
  category: string,
): "weekly" | "monthly" {
  if (MONTHLY_KEYWORDS.some((k) => keyword.includes(k))) return "monthly";
  if (MEME_CATEGORIES.includes(category)) return "weekly";
  return "weekly";
}

function getExpiry(duration: "weekly" | "monthly"): Date {
  const now = new Date();
  now.setDate(now.getDate() + (duration === "monthly" ? 30 : 7));
  return now;
}

function getBoosts(category: string): {
  yieldBoost: number;
  priceFloorMultiplier: number;
} {
  switch (category) {
    case "celebrity":
      return { yieldBoost: 2.0, priceFloorMultiplier: 1.5 };
    case "sports":
      return { yieldBoost: 1.8, priceFloorMultiplier: 1.4 };
    case "event":
      return { yieldBoost: 1.6, priceFloorMultiplier: 1.3 };
    case "meme":
      return { yieldBoost: 1.5, priceFloorMultiplier: 1.2 };
    default:
      return { yieldBoost: 1.5, priceFloorMultiplier: 1.2 };
  }
}

async function fetchGoogleTrends(): Promise<
  { keyword: string; category: string }[]
> {
  try {
    const res = await fetch(
      "https://trends.google.com/trends/trendingsearches/daily/rss?geo=US",
      { next: { revalidate: 0 } },
    );
    const xml = await res.text();
    const matches = [
      ...xml.matchAll(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/g),
    ];
    const titles = matches.slice(1).map((m) => m[1].toLowerCase().trim());

    const keywords: { keyword: string; category: string }[] = [];
    const seen = new Set<string>();

    for (const title of titles.slice(0, 20)) {
      if (!seen.has(title)) {
        seen.add(title);
        keywords.push({ keyword: title, category: guessCategory(title) });
      }
      for (const word of title.split(/\s+/)) {
        const clean = word.replace(/[^a-z0-9]/g, "");
        if (clean.length >= 3 && !seen.has(clean)) {
          seen.add(clean);
          keywords.push({ keyword: clean, category: guessCategory(clean) });
        }
      }
    }
    return keywords.slice(0, 30);
  } catch (err) {
    console.error("[trending-sync] Google Trends fetch failed:", err);
    return [];
  }
}

function guessCategory(keyword: string): string {
  const celebrities = [
    "taylor",
    "swift",
    "beyonce",
    "drake",
    "kanye",
    "ye",
    "rihanna",
    "mrbeast",
    "elon",
    "musk",
    "trump",
    "lebron",
    "ronaldo",
    "messi",
  ];
  const sports = [
    "nba",
    "nfl",
    "mlb",
    "nhl",
    "ufc",
    "fifa",
    "worldcup",
    "superbowl",
    "playoff",
    "championship",
    "finals",
  ];
  const events = [
    "election",
    "olympics",
    "oscars",
    "grammy",
    "vma",
    "coachella",
    "summit",
    "launch",
    "release",
  ];
  if (celebrities.some((c) => keyword.includes(c))) return "celebrity";
  if (sports.some((s) => keyword.includes(s))) return "sports";
  if (events.some((e) => keyword.includes(e))) return "event";
  if (/^\d+$/.test(keyword)) return "meme";
  return "viral";
}

export async function GET(req: NextRequest) {
  // ── Auth: allow Vercel cron (secret header) OR direct browser hit ──
  const secret = req.headers.get("x-cron-secret");
  if (secret && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // If no secret header at all → allow (manual trigger / dev testing)

  await connectDB();

  // 1. Expire old entries
  await Trending.updateMany(
    { expiresAt: { $lte: new Date() }, isActive: true },
    { $set: { isActive: false } },
  );

  // 2. Fetch trends
  const trendingKeywords = await fetchGoogleTrends();
  if (!trendingKeywords.length) {
    return NextResponse.json({ success: true, message: "No trends fetched" });
  }

  const results: any[] = [];

  for (const { keyword, category } of trendingKeywords) {
    const existing = await Trending.findOne({ keyword, isActive: true });
    if (existing) continue;

    const matched = (await Username.find({
      username: { $regex: keyword, $options: "i" },
    })
      .select("username")
      .lean()) as any[];

    if (!matched.length) continue;

    const matchedNames = matched.map((u: any) => u.username);
    const duration = classifyDuration(keyword, category);
    const { yieldBoost, priceFloorMultiplier } = getBoosts(category);

    const trending = await Trending.create({
      keyword,
      matchedUsernames: matchedNames,
      source: "google",
      category,
      duration,
      yieldBoost,
      priceFloorMultiplier,
      expiresAt: getExpiry(duration),
      isActive: true,
    });

    await Username.updateMany(
      { username: { $in: matchedNames } },
      {
        $set: {
          "trending.isActive": true,
          "trending.keyword": keyword,
          "trending.yieldBoost": yieldBoost,
          "trending.priceFloorMultiplier": priceFloorMultiplier,
          "trending.expiresAt": trending.expiresAt,
          "trending.category": category,
        },
      },
    );

    results.push({ keyword, matched: matchedNames.length, duration, category });
  }

  // Clear expired username flags
  await Username.updateMany(
    { "trending.expiresAt": { $lte: new Date() }, "trending.isActive": true },
    { $set: { "trending.isActive": false } },
  );

  return NextResponse.json({ success: true, synced: results });
}
