"use client";
// app/dashboard/page.tsx
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import ProfileCustomizeModal from "@/components/dashboard/modals/ProfileCustomizeModal";

function DashboardInner() {
  const dash = useDashboard();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Sync active tab from URL ?tab=
  useEffect(() => {
    const tabFromUrl = (searchParams.get("tab") ?? "overview") as any;
    if (tabFromUrl !== dash.activeTab) {
      dash.setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Helper: change tab AND update URL
  const changeTab = (tab: string) => {
    dash.setActiveTab(tab as any);
    router.replace(`/dashboard?tab=${tab}`, { scroll: false });
  };

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
        onOpenSettings={() => router.push("/settings")}
        onLogout={dash.logout}
        onWalletLinked={(pk) => dash.setWallet(pk)}
        onOpenProfile={() => router.push("/profile")}
      />

      {/* Sidebar + main layout — profile tab removed, it lives at /profile */}
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar
          activeTab={dash.activeTab}
          sidebarOpen={sidebarOpen}
          usernameCount={dash.userData.usernames?.length ?? 0}
          referralCount={dash.userData.referrals ?? 0}
          onTabChange={(tab) => {
            if (tab === "settings") {
              router.push("/settings");
            } else if (tab === "profile") {
              router.push("/profile");
            } else {
              changeTab(tab);
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
                onTabChange={changeTab}
                onClaim={dash.claimUsername}
                onClaimSuccess={dash.refreshUserData}
              />
            )}

            {dash.activeTab === "usernames" && (
              <UsernamesTab
                usernames={dash.userData.usernames}
                activeUsername={dash.activeUsername}
                onClaim={() => setShowUsernameModal(true)}
                onTabChange={changeTab}
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
                onClaim={dash.claimStakingPosition}
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
              <ReferralsTab
                userData={dash.userData}
                wallet={dash.wallet}
                onClaimReferralRewards={dash.claimReferralRewards}
              />
            )}

            {dash.activeTab === "marketplace" && <MarketplaceTab />}
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

      {showCustomizeModal && (
        <ProfileCustomizeModal
          currentName={dash.activeUsername ?? dash.displayName ?? ""}
          initialCustomization={dash.customization}
          onSave={async (c) => {
            await dash.saveCustomization(c);
            setShowCustomizeModal(false);
          }}
          onClose={() => setShowCustomizeModal(false)}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardInner />
    </Suspense>
  );
}
