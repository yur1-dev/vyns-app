// components/dashboard/ui.tsx
import type { UsernameTier } from "@/types/dashboard";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function Pill({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${className}`}
    >
      {children}
    </span>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[13px] font-semibold text-white/40 uppercase tracking-widest mb-4">
      {children}
    </h2>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <Card className="p-5 flex flex-col gap-3 hover:border-white/[0.10] transition-colors">
      <span className={`text-xs font-medium ${accent}`}>{label}</span>
      <div>
        <div className="text-2xl font-semibold text-white tabular-nums tracking-tight">
          {value}
        </div>
        {sub && <div className="text-xs text-white/30 mt-0.5">{sub}</div>}
      </div>
    </Card>
  );
}

export function EmptyState({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
}) {
  return (
    <div className="py-12 text-center">
      <div className="flex justify-center mb-3 text-white/10">{icon}</div>
      <p className="text-sm text-white/25">{title}</p>
      {sub && <p className="text-xs text-white/15 mt-1">{sub}</p>}
    </div>
  );
}

export function NumberInput({
  value,
  onChange,
  placeholder,
  suffix,
  hint,
  max,
  onMax,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
  hint?: string;
  max?: number;
  onMax?: () => void;
}) {
  return (
    <div>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "0.00"}
          style={{ MozAppearance: "textfield" } as React.CSSProperties}
          className="
            w-full px-4 py-2.5 pr-20 rounded-xl
            bg-white/[0.04] border border-white/[0.07]
            focus:border-teal-500/40 focus:ring-2 focus:ring-teal-500/10
            outline-none text-sm text-white placeholder-white/20
            transition-all
            [appearance:textfield]
            [&::-webkit-outer-spin-button]:appearance-none
            [&::-webkit-inner-spin-button]:appearance-none
          "
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {suffix && <span className="text-xs text-white/25">{suffix}</span>}
          {onMax && (
            <button
              type="button"
              onClick={onMax}
              className="text-xs text-teal-400 hover:text-teal-300 font-medium cursor-pointer"
            >
              MAX
            </button>
          )}
        </div>
      </div>
      {hint && <p className="text-xs text-white/20 mt-1.5">{hint}</p>}
    </div>
  );
}

export const TIER_CONFIG = {
  Diamond: {
    label: "💎 Diamond",
    cls: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  },
  Platinum: {
    label: "⬡ Platinum",
    cls: "text-purple-300 bg-purple-500/10 border-purple-500/20",
  },
  Gold: {
    label: "✦ Gold",
    cls: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  Silver: {
    label: "◈ Silver",
    cls: "text-slate-300 bg-slate-500/10 border-slate-500/20",
  },
  Bronze: {
    label: "◉ Bronze",
    cls: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  },
} satisfies Record<UsernameTier, { label: string; cls: string }>;

export function tierFromLen(len: number): keyof typeof TIER_CONFIG {
  if (len <= 3) return "Diamond";
  if (len <= 5) return "Platinum";
  if (len <= 8) return "Gold";
  if (len <= 15) return "Silver";
  return "Bronze";
}

export function priceFromLen(len: number): number {
  return len <= 3
    ? 1.0
    : len <= 5
      ? 0.5
      : len <= 8
        ? 0.25
        : len <= 15
          ? 0.1
          : 0.05;
}
