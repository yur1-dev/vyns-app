"use client";
// app/dashboard/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
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
import ProfileTab from "@/components/dashboard/tabs/ProfileTab";

export default function DashboardPage() {
  const dash = useDashboard();
  const router = useRouter();
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

  const isProfile = dash.activeTab === "profile";

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
        onOpenSettings={() => router.push("/settings")}
        onSaveCustomization={dash.saveCustomization}
        onLogout={dash.logout}
        onWalletLinked={(pk) => dash.setWallet(pk)}
        onOpenProfile={() => dash.setActiveTab("profile")}
      />

      {isProfile ? (
        /* ── Profile: full width, no sidebar ───────────────────────── */
        <div className="flex-1 overflow-y-auto">
          <ProfileTab
            session={dash.session}
            userData={dash.userData}
            wallet={dash.wallet}
            provider={dash.provider}
            displayName={dash.displayName}
            activeUsername={dash.activeUsername}
            customization={dash.customization}
            onSaveCustomization={dash.saveCustomization}
            onTabChange={(tab) => dash.setActiveTab(tab as any)}
          />
        </div>
      ) : (
        /* ── All other tabs: sidebar + main ────────────────────────── */
        <div className="flex flex-1 overflow-hidden">
          <DashboardSidebar
            activeTab={dash.activeTab}
            sidebarOpen={sidebarOpen}
            usernameCount={dash.userData.usernames?.length ?? 0}
            referralCount={dash.userData.referrals ?? 0}
            onTabChange={(tab) => {
              if (tab === "settings") {
                router.push("/settings");
              } else {
                dash.setActiveTab(tab);
              }
            }}
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
                      await dash.refreshUserData();
                      return { success: true };
                    } else {
                      dash.optimisticStakeUsername(username, false);
                      return { success: false, error: data.error };
                    }
                  }}
                  onUnstakeUsername={async (_id, username, signature) => {
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
                      await dash.refreshUserData();
                      return { success: true };
                    } else {
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
            </div>
          </main>
        </div>
      )}

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
