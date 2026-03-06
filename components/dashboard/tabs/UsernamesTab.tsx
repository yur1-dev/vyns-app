"use client";
// components/dashboard/tabs/UsernamesTab.tsx

import { useState } from "react";
import {
  Plus,
  Crown,
  Calendar,
  ExternalLink,
  Search,
  Shield,
  Check,
  Loader2,
  TrendingUp,
  Tag,
  X,
  DollarSign,
} from "lucide-react";
import {
  Card,
  Pill,
  SectionTitle,
  TIER_CONFIG,
  tierFromLen,
  NumberInput,
} from "@/components/dashboard/ui";
import { TIER_PRICING } from "@/types/dashboard";
import type { UsernameItem, UsernameTier, TabId } from "@/types/dashboard";

interface Props {
  usernames: UsernameItem[];
  activeUsername?: string | null;
  onClaim: () => void;
  onTabChange: (tab: TabId) => void;
  onSetActiveUsername: (
    username: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onListUsername?: (
    username: string,
    price: number,
  ) => Promise<{ success: boolean; error?: string }>;
  onDelistUsername?: (
    username: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

// ── List for Sale Modal ───────────────────────────────────────────────────────

function ListModal({
  username,
  suggestedPrice,
  onConfirm,
  onClose,
}: {
  username: string;
  suggestedPrice: number;
  onConfirm: (price: number) => Promise<void>;
  onClose: () => void;
}) {
  const [price, setPrice] = useState(suggestedPrice.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const num = parseFloat(price) || 0;

  const handleConfirm = async () => {
    if (num <= 0) {
      setError("Enter a valid price");
      return;
    }
    setLoading(true);
    setError("");
    await onConfirm(num);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#0a0f1a] shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-5 bg-teal-500/[0.04]">
          {!loading && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/20 hover:text-white/50"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="w-11 h-11 rounded-2xl bg-teal-500/15 flex items-center justify-center mb-3">
            <Tag className="h-5 w-5 text-teal-400" />
          </div>
          <p className="text-base font-semibold text-white">
            List @{username} for sale
          </p>
          <p className="text-xs text-white/40 mt-1">
            Set your asking price in SOL. Buyers can purchase directly from the
            marketplace.
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-white/40 uppercase tracking-widest">
              Price (SOL)
            </label>
            <NumberInput
              value={price}
              onChange={(v) => {
                setPrice(v);
                setError("");
              }}
              placeholder="0.00"
              suffix="SOL"
            />
            {suggestedPrice > 0 && (
              <p className="text-[11px] text-white/25">
                Suggested floor: {suggestedPrice} SOL ·{" "}
                <button
                  onClick={() => setPrice(suggestedPrice.toString())}
                  className="text-teal-400 hover:underline cursor-pointer"
                >
                  use this
                </button>
              </p>
            )}
          </div>

          <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] divide-y divide-white/[0.04]">
            {[
              ["Username", `@${username}`],
              ["You receive", `${(num * 0.975).toFixed(4)} SOL`],
              ["Platform fee", "2.5%"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between px-4 py-2.5"
              >
                <span className="text-xs text-white/35">{k}</span>
                <span className="text-xs text-white font-medium">{v}</span>
              </div>
            ))}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-white/40 text-sm hover:text-white/70 transition-all cursor-pointer disabled:opacity-30"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || num <= 0}
              className="flex-1 py-2.5 rounded-xl bg-teal-500/15 border border-teal-500/25 text-teal-400 text-sm font-semibold hover:bg-teal-500/25 transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Tag className="h-4 w-4" />
              )}
              List for sale
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Username Card ─────────────────────────────────────────────────────────────

function UsernameCard({
  u,
  isActive,
  onSetActive,
  settingActive,
  onList,
  onDelist,
  listingId,
  delistingId,
}: {
  u: UsernameItem;
  isActive: boolean;
  onSetActive: () => void;
  settingActive: boolean;
  onList: () => void;
  onDelist: () => void;
  listingId: string | null;
  delistingId: string | null;
}) {
  const displayName = (u as any).username ?? u.name ?? "";
  const tierKey = (u.tier ?? tierFromLen(displayName.length)) as UsernameTier;
  const tierCfg = TIER_CONFIG[tierKey] ?? TIER_CONFIG.Bronze;
  const pricing = TIER_PRICING[tierKey];
  const isListed = (u as any).isListed ?? false;

  const exp = new Date(u.expiresAt);
  const daysLeft = Math.max(
    0,
    Math.floor((exp.getTime() - Date.now()) / 86400000),
  );
  const expiring = daysLeft < 30;
  const isValidDate = !isNaN(exp.getTime());

  const yieldPct =
    u.yield > 0
      ? u.yield
      : tierKey === "Diamond"
        ? 5
        : tierKey === "Platinum"
          ? 3
          : tierKey === "Gold"
            ? 1.5
            : 0;

  const isListingThis = listingId === displayName;
  const isDelistingThis = delistingId === displayName;

  return (
    <Card
      className={`p-5 flex flex-col gap-4 transition-all duration-200 group ${
        isActive
          ? "border-teal-500/25 bg-teal-500/[0.03]"
          : "hover:border-white/[0.10]"
      }`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Pill className={tierCfg.cls}>{tierCfg.label}</Pill>
          {isActive && (
            <Pill className="text-teal-400 bg-teal-500/10 border-teal-500/20">
              <Check className="h-2.5 w-2.5" /> In use
            </Pill>
          )}
          {u.staked && (
            <Pill className="text-violet-400 bg-violet-500/10 border-violet-500/20">
              <Shield className="h-2.5 w-2.5" /> Staked
            </Pill>
          )}
          {isListed && !u.staked && (
            <Pill className="text-amber-400 bg-amber-500/10 border-amber-500/20">
              <Tag className="h-2.5 w-2.5" /> Listed
            </Pill>
          )}
        </div>
        <a
          href={`https://vyns.io/${displayName}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg text-white/15 hover:text-white/60 hover:bg-white/[0.05] opacity-0 group-hover:opacity-100 transition-all"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Username */}
      <p
        className={`text-2xl font-semibold tracking-tight ${isActive ? "text-teal-300" : "text-white"}`}
      >
        @{displayName || "—"}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
          <p className="text-[10px] text-white/30 mb-1 uppercase tracking-widest">
            Yield
          </p>
          <p className="text-sm font-semibold text-teal-400">
            {yieldPct > 0 ? `${yieldPct}%` : "—"}
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
          <p className="text-[10px] text-white/30 mb-1 uppercase tracking-widest">
            Value
          </p>
          <p className="text-sm font-semibold text-white">
            {isListed
              ? `${(u as any).listedPrice ?? pricing?.price ?? "—"} SOL`
              : pricing
                ? `${pricing.price} SOL`
                : "—"}
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
          <p className="text-[10px] text-white/30 mb-1 uppercase tracking-widest">
            Length
          </p>
          <p className="text-sm font-semibold text-white/60">
            {displayName.length}c
          </p>
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-1 border-t border-white/[0.04] gap-2">
        <span
          className={`text-xs flex items-center gap-1.5 shrink-0 ${expiring ? "text-red-400" : "text-white/25"}`}
        >
          <Calendar className="h-3 w-3 shrink-0" />
          {!isValidDate
            ? "—"
            : expiring
              ? `Expires in ${daysLeft}d`
              : exp.toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
        </span>

        <div className="flex items-center gap-1.5">
          {!isActive && !u.staked && (
            <button
              onClick={onSetActive}
              disabled={settingActive}
              className="text-[10px] px-2 py-1 rounded-lg border border-teal-500/20 text-teal-400 hover:bg-teal-500/10 cursor-pointer transition-all disabled:opacity-40 flex items-center gap-1"
            >
              {settingActive ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              ) : (
                <Check className="h-2.5 w-2.5" />
              )}
              Use
            </button>
          )}

          {!u.staked &&
            (isListed ? (
              <button
                onClick={onDelist}
                disabled={isDelistingThis}
                className="text-[10px] px-2 py-1 rounded-lg border border-white/10 text-white/30 hover:text-red-400 hover:border-red-500/30 cursor-pointer transition-all disabled:opacity-40 flex items-center gap-1"
              >
                {isDelistingThis ? (
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                ) : (
                  <X className="h-2.5 w-2.5" />
                )}
                Delist
              </button>
            ) : (
              <button
                onClick={onList}
                disabled={isListingThis}
                className="text-[10px] px-2 py-1 rounded-lg border border-amber-500/25 text-amber-400 hover:bg-amber-500/10 cursor-pointer transition-all disabled:opacity-40 flex items-center gap-1"
              >
                {isListingThis ? (
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                ) : (
                  <Tag className="h-2.5 w-2.5" />
                )}
                Sell
              </button>
            ))}
        </div>
      </div>

      {isListed && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/[0.06] border border-amber-500/15 -mt-1">
          <DollarSign className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-400/80">
            Listed on marketplace for{" "}
            <span className="font-semibold">
              {(u as any).listedPrice ?? pricing?.price} SOL
            </span>
          </p>
        </div>
      )}
    </Card>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────────────────

export default function UsernamesTab({
  usernames,
  activeUsername,
  onClaim,
  onTabChange,
  onSetActiveUsername,
  onListUsername,
  onDelistUsername,
}: Props) {
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState<UsernameTier | "All">("All");
  const [settingId, setSettingId] = useState<string | null>(null);
  const [listingId, setListingId] = useState<string | null>(null);
  const [delistingId, setDelistingId] = useState<string | null>(null);
  const [listModal, setListModal] = useState<{
    username: string;
    price: number;
  } | null>(null);
  const [error, setError] = useState("");

  const tiers: Array<UsernameTier | "All"> = [
    "All",
    "Diamond",
    "Platinum",
    "Gold",
    "Silver",
    "Bronze",
  ];

  const filtered = usernames.filter((u) => {
    const name = ((u as any).username ?? u.name ?? "").toLowerCase();
    return (
      name.includes(search.toLowerCase()) &&
      (filterTier === "All" || u.tier === filterTier)
    );
  });

  const handleSetActive = async (u: UsernameItem) => {
    const name = (u as any).username ?? u.name ?? "";
    setSettingId(name);
    setError("");
    const r = await onSetActiveUsername(name);
    setSettingId(null);
    if (!r.success) setError(r.error ?? "Failed to set username");
  };

  const handleList = async (username: string, price: number) => {
    setListingId(username);
    const r = await onListUsername?.(username, price);
    setListingId(null);
    setListModal(null);
    if (!r?.success) setError(r?.error ?? "Failed to list");
  };

  const handleDelist = async (username: string) => {
    setDelistingId(username);
    setError("");
    const r = await onDelistUsername?.(username);
    setDelistingId(null);
    if (!r?.success) setError(r?.error ?? "Failed to delist");
  };

  const activeU = activeUsername
    ? usernames.find((u) => ((u as any).username ?? u.name) === activeUsername)
    : null;
  const activeTierKey = activeU
    ? ((activeU.tier ??
        tierFromLen(activeUsername?.length ?? 0)) as UsernameTier)
    : null;
  const activeTierCfg = activeTierKey ? TIER_CONFIG[activeTierKey] : null;
  const activeYield = activeU
    ? activeU.yield > 0
      ? activeU.yield
      : activeTierKey === "Diamond"
        ? 5
        : activeTierKey === "Platinum"
          ? 3
          : activeTierKey === "Gold"
            ? 1.5
            : 0
    : 0;

  return (
    <>
      {listModal && (
        <ListModal
          username={listModal.username}
          suggestedPrice={listModal.price}
          onConfirm={(price) => handleList(listModal.username, price)}
          onClose={() => setListModal(null)}
        />
      )}

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <SectionTitle>My Usernames</SectionTitle>
          <button
            onClick={onClaim}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-teal-400 text-xs font-medium transition-all cursor-pointer -mt-4"
          >
            <Plus className="h-3.5 w-3.5" /> Claim new
          </button>
        </div>

        {activeUsername && activeTierCfg && (
          <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/15 flex items-center justify-center shrink-0">
                <Crown className="h-4 w-4 text-teal-400" />
              </div>
              <div>
                <p className="text-[11px] text-white/30 mb-0.5">
                  Active username
                </p>
                <p className="text-base font-semibold text-white">
                  @{activeUsername}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-white/25 mb-0.5">Tier</p>
                <Pill className={activeTierCfg.cls}>{activeTierCfg.label}</Pill>
              </div>
              {activeYield > 0 && (
                <div className="text-right">
                  <p className="text-[10px] text-white/25 mb-0.5">Yield</p>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-teal-400" />
                    <span className="text-sm font-semibold text-teal-400">
                      {activeYield}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {usernames.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 text-center">
              <p className="text-2xl font-semibold text-white">
                {usernames.length}
              </p>
              <p className="text-xs text-white/30 mt-0.5">Total</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-semibold text-violet-400">
                {usernames.filter((u) => u.staked).length}
              </p>
              <p className="text-xs text-white/30 mt-0.5">Staked</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-semibold text-amber-400">
                {usernames.filter((u) => (u as any).isListed).length}
              </p>
              <p className="text-xs text-white/30 mt-0.5">Listed</p>
            </Card>
          </div>
        )}

        {usernames.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search usernames..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.07] text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/30 transition-all"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {tiers.map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterTier(t)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                    filterTier === t
                      ? "bg-teal-500/20 border-teal-500/30 text-teal-400"
                      : "bg-white/[0.03] border-white/[0.07] text-white/30 hover:text-white/60"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {usernames.length === 0 ? (
          <Card className="py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/15 flex items-center justify-center mx-auto mb-4">
              <Crown className="h-7 w-7 text-teal-400" />
            </div>
            <p className="text-base font-medium text-white/60 mb-1">
              No usernames yet
            </p>
            <p className="text-sm text-white/25 mb-6 max-w-xs mx-auto">
              Claim your first username to start earning yield on-chain. Short
              names earn more.
            </p>
            <button
              onClick={onClaim}
              className="px-5 py-2.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/25 text-teal-400 text-sm font-semibold transition-all cursor-pointer"
            >
              <Crown className="h-4 w-4 inline mr-1.5 -mt-0.5" />
              Claim your first username
            </button>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="py-12 text-center">
            <Search className="h-6 w-6 mx-auto mb-3 text-white/10" />
            <p className="text-sm text-white/25">
              No usernames match your search
            </p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((u, i) => {
              const name = (u as any).username ?? u.name ?? "";
              return (
                <UsernameCard
                  key={name || i}
                  u={u}
                  isActive={activeUsername === name}
                  onSetActive={() => handleSetActive(u)}
                  settingActive={settingId === name}
                  onList={() => {
                    const pricing =
                      TIER_PRICING[u.tier ?? tierFromLen(name.length)];
                    setListModal({
                      username: name,
                      price: pricing?.price ?? 0.1,
                    });
                  }}
                  onDelist={() => handleDelist(name)}
                  listingId={listingId}
                  delistingId={delistingId}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
