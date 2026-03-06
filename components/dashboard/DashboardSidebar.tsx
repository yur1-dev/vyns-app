"use client";

// components/dashboard/DashboardSidebar.tsx

import {
  LayoutDashboard,
  Crown,
  TrendingUp,
  Zap,
  Users,
  ShoppingBag,
} from "lucide-react";
import type { TabId } from "@/types/dashboard";

const NAV = [
  { id: "overview" as TabId, icon: LayoutDashboard, label: "Overview" },
  { id: "usernames" as TabId, icon: Crown, label: "Usernames" },
  { id: "earnings" as TabId, icon: TrendingUp, label: "Earnings" },
  { id: "staking" as TabId, icon: Zap, label: "Staking" },
  { id: "referrals" as TabId, icon: Users, label: "Referrals" },
  { id: "marketplace" as TabId, icon: ShoppingBag, label: "Marketplace" },
];

interface Props {
  activeTab: TabId;
  sidebarOpen: boolean;
  usernameCount: number;
  referralCount: number;
  onTabChange: (tab: TabId) => void;
  onClose: () => void;
}

export default function DashboardSidebar({
  activeTab,
  sidebarOpen,
  usernameCount,
  referralCount,
  onTabChange,
  onClose,
}: Props) {
  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 top-14 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/*
        KEY FIX: sidebar must be `sticky top-14` and `self-start` on desktop
        so it pins to the top of the viewport and does NOT scroll with content.
        On mobile it stays `fixed`.
      */}
      <aside
        className={`
          fixed top-14 left-0 z-50 w-52
          h-[calc(100vh-3.5rem)]
          border-r border-white/[0.05] bg-[#060b14]
          overflow-hidden
          transition-transform duration-300 ease-in-out
          lg:sticky lg:top-14 lg:z-auto lg:translate-x-0
          lg:h-[calc(100vh-3.5rem)] lg:shrink-0 lg:self-start
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <nav className="flex flex-col gap-0.5 p-3 pt-4">
          {NAV.map((item) => {
            const active = activeTab === item.id;
            const badge =
              item.id === "usernames" && usernameCount > 0
                ? usernameCount
                : item.id === "referrals" && referralCount > 0
                  ? referralCount
                  : null;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  onClose();
                }}
                className={`
                  relative w-full flex items-center justify-between
                  px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150 cursor-pointer group
                  ${
                    active
                      ? "bg-white/[0.07] text-white"
                      : "text-white/30 hover:text-white/70 hover:bg-white/[0.04]"
                  }
                `}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-teal-400 rounded-r-full" />
                )}
                <div className="flex items-center gap-2.5">
                  <item.icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      active ? "text-teal-400" : "group-hover:text-white/50"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {badge !== null && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-teal-500/15 text-teal-400 tabular-nums">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
