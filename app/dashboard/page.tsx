"use client";
// app/dashboard/page.tsx
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useDashboard } from "@/hook/useDashboard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import OverviewTab from "@/components/dashboard/tabs/OverviewTab";
import UsernamesTab from "@/components/dashboard/tabs/UsernamesTab";
import StakingTab from "@/components/dashboard/tabs/StakingTab";
import EarningsTab from "@/components/dashboard/tabs/EarningsTab";
import ReferralsTab from "@/components/dashboard/tabs/ReferralsTab";
import MarketplaceTab from "@/components/dashboard/tabs/MarketplaceTab";
import UsernameModal from "@/components/dashboard/modals/UsernameModal";

export default function DashboardPage() {
  const dash = useDashboard();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  if (dash.loading) {
    return (
      <div className="min-h-screen bg-[#060b14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-400/50" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#060b14] text-white flex flex-col overflow-hidden">
      <DashboardHeader
        session={dash.session}
        wallet={dash.wallet}
        provider={dash.provider}
        displayName={dash.displayName}
        activeUsername={dash.activeUsername}
        customization={dash.customization}
        notifications={notifications}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onMarkNotifsRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
        onOpenSettings={() => dash.setActiveTab("settings")}
        onSaveCustomization={dash.saveCustomization}
        onLogout={dash.logout}
      />

      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar
          activeTab={dash.activeTab}
          sidebarOpen={sidebarOpen}
          usernameCount={dash.userData.usernames?.length ?? 0}
          referralCount={dash.userData.referrals ?? 0}
          onTabChange={dash.setActiveTab}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {dash.activeTab === "overview" && (
              <OverviewTab
                userData={dash.userData}
                session={dash.session}
                onTabChange={dash.setActiveTab}
                onClaim={dash.claimUsername}
                onClaimSuccess={dash.refreshUserData}
              />
            )}

            {dash.activeTab === "usernames" && (
              <UsernamesTab
                usernames={dash.userData.usernames}
                activeUsername={dash.activeUsername}
                onClaim={() => setShowUsernameModal(true)}
                onTabChange={dash.setActiveTab}
                onSetActiveUsername={dash.setActiveUsername}
                onListUsername={dash.listUsername}
                onDelistUsername={dash.delistUsername}
              />
            )}

            {dash.activeTab === "staking" && (
              <StakingTab
                userData={dash.userData}
                balance={dash.balance}
                walletAddress={dash.wallet ?? undefined}
                onStake={async (amount, lockPeriod) => {
                  const res = await fetch("/api/staking/stake", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ amount, lockPeriod }),
                  });
                  const data = await res.json();
                  if (data.success) await dash.refreshUserData();
                  return data.success
                    ? { success: true }
                    : { success: false, error: data.error };
                }}
                onClaim={async (positionId) => {
                  const res = await fetch("/api/staking/claim", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ positionId }),
                  });
                  const data = await res.json();
                  if (data.success) await dash.refreshUserData();
                  return data.success
                    ? { success: true }
                    : { success: false, error: data.error };
                }}
                onStakeUsername={async (_id, username, signature) => {
                  // Optimistically update UI immediately so the user sees
                  // the name move to "Earning now" without waiting for re-fetch
                  dash.optimisticStakeUsername(username, true);

                  const res = await fetch("/api/username/stake", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                      username,
                      action: "stake",
                      signature,
                      wallet: dash.wallet,
                    }),
                  });
                  const data = await res.json();

                  if (data.success) {
                    // Sync with server to get authoritative state
                    await dash.refreshUserData();
                    return { success: true };
                  } else {
                    // Revert optimistic update on failure
                    dash.optimisticStakeUsername(username, false);
                    return { success: false, error: data.error };
                  }
                }}
                onUnstakeUsername={async (_id, username, signature) => {
                  // Optimistically update UI immediately so the user sees
                  // the name move to "Available to stake" without waiting
                  dash.optimisticStakeUsername(username, false);

                  const res = await fetch("/api/username/stake", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                      username,
                      action: "unstake",
                      signature,
                      wallet: dash.wallet,
                    }),
                  });
                  const data = await res.json();

                  if (data.success) {
                    // Sync with server to get authoritative state
                    await dash.refreshUserData();
                    return { success: true };
                  } else {
                    // Revert optimistic update on failure
                    dash.optimisticStakeUsername(username, true);
                    return { success: false, error: data.error };
                  }
                }}
              />
            )}

            {dash.activeTab === "earnings" && (
              <EarningsTab userData={dash.userData} />
            )}

            {dash.activeTab === "referrals" && (
              <ReferralsTab userData={dash.userData} wallet={dash.wallet} />
            )}

            {dash.activeTab === "marketplace" && <MarketplaceTab />}

            {dash.activeTab === "settings" && (
              <div className="space-y-6">
                <p className="text-sm font-semibold text-white/60">Settings</p>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-sm text-white/25 text-center">
                  Settings coming soon.
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <UsernameModal
        open={showUsernameModal}
        balance={dash.balance ?? 0}
        onClose={() => setShowUsernameModal(false)}
        onClaim={async (username: string) => {
          const result = await dash.claimUsername(username);
          if (result.success) setShowUsernameModal(false);
          return result;
        }}
      />
    </div>
  );
}
