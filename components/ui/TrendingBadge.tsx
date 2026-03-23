// components/ui/TrendingBadge.tsx
import { Flame, Star, Trophy, Zap, Music } from "lucide-react";

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: any; gradient: string; glow: string }
> = {
  celebrity: {
    label: "Celebrity",
    icon: Star,
    gradient: "from-yellow-400 to-orange-500",
    glow: "shadow-orange-500/50",
  },
  sports: {
    label: "Sports",
    icon: Trophy,
    gradient: "from-blue-400 to-cyan-500",
    glow: "shadow-cyan-500/50",
  },
  meme: {
    label: "Viral",
    icon: Zap,
    gradient: "from-purple-400 to-pink-500",
    glow: "shadow-pink-500/50",
  },
  event: {
    label: "Event",
    icon: Music,
    gradient: "from-green-400 to-teal-500",
    glow: "shadow-teal-500/50",
  },
  viral: {
    label: "Trending",
    icon: Flame,
    gradient: "from-red-400 to-orange-500",
    glow: "shadow-orange-500/50",
  },
};

interface TrendingBadgeProps {
  category: string;
  keyword: string;
  yieldBoost: number;
  expiresAt: string;
  size?: "sm" | "md";
}

export function TrendingBadge({
  category,
  keyword,
  yieldBoost,
  expiresAt,
  size = "sm",
}: TrendingBadgeProps) {
  const config = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.viral;
  const Icon = config.icon;

  const daysLeft = Math.ceil(
    (new Date(expiresAt).getTime() - Date.now()) / 86_400_000,
  );

  const boostLabel = `+${Math.round((yieldBoost - 1) * 100)}% yield`;

  return (
    <div className="flex flex-col gap-1">
      <div
        className={`
          inline-flex items-center gap-1.5 px-2 py-1 rounded-full
          bg-gradient-to-r ${config.gradient}
          shadow-lg ${config.glow}
          animate-pulse
          ${size === "md" ? "text-sm" : "text-xs"}
          font-semibold text-white
        `}
      >
        <Icon size={size === "md" ? 14 : 12} />
        <span>{config.label}</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-green-400 font-medium">{boostLabel}</span>
        <span className="text-white/40">·</span>
        <span className="text-white/50">{daysLeft}d left</span>
      </div>
    </div>
  );
}
