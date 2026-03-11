"use client";
// hook/useDashboard.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { TabId, UserData } from "@/types/dashboard";
import type { ProfileCustomization } from "@/components/dashboard/modals/ProfileCustomizeModal";

const DEFAULT_USER_DATA: UserData = {
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  nextLevelXp: 100,
  isNewUser: true,
  usernames: [],
  earnings: { today: 0, week: 0, month: 0, allTime: 0 },
  referralEarnings: 0,
  stakingRewards: 0,
  stakedAmount: 0,
  stakingPositions: [],
  referrals: 0,
  referralCode: "",
  activity: [],
};

const DEFAULT_CUSTOMIZATION: ProfileCustomization = {
  theme: "teal",
  petId: "none",
  avatarSeed: "",
};

export function useDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [userData, setUserData] = useState<UserData>(DEFAULT_USER_DATA);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [wallet, setWallet] = useState<string | null>(null);
  const [provider, setProvider] = useState("wallet");
  const [activeUsername, setActiveUsernameState] = useState<string | null>(
    null,
  );
  const [customization, setCustomization] = useState<ProfileCustomization>(
    DEFAULT_CUSTOMIZATION,
  );

  // ── Guard: only run init once per mount ───────────────────────────────────
  // Without this, switching browser tabs causes the session object to get a
  // new reference on re-render, which re-triggers the useEffect, which
  // re-runs init() and may incorrectly push to /login.
  const initDone = useRef(false);

  // ── Balance ────────────────────────────────────────────────────────────────
  const fetchBalance = useCallback(async (pk: string) => {
    try {
      const rpc =
        process.env.NEXT_PUBLIC_SOLANA_RPC ||
        "https://api.mainnet-beta.solana.com";
      const res = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getBalance",
          params: [pk],
        }),
      });
      const data = await res.json();
      setBalance(data.result?.value ? data.result.value / 1e9 : 0);
    } catch {
      setBalance(0);
    }
  }, []);

  // ── Staking positions ──────────────────────────────────────────────────────
  const fetchStakingPositions = useCallback(async () => {
    try {
      const res = await fetch("/api/staking/positions", {
        credentials: "include",
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.success ? data.positions : [];
    } catch {
      return [];
    }
  }, []);

  // ── User data ──────────────────────────────────────────────────────────────
  const fetchUserData = useCallback(
    async (walletAddress: string | null, sessionData: any) => {
      try {
        let res: Response;
        if (walletAddress) res = await fetch(`/api/user/${walletAddress}`);
        else if (sessionData?.user)
          res = await fetch("/api/user/me", { credentials: "include" });
        else return;
        if (!res.ok) return;
        const data = await res.json();
        const payload = data.user ?? data;

        const positions = await fetchStakingPositions();
        const stakingRewards = positions
          .filter((p: any) => p.status !== "claimed")
          .reduce((acc: number, p: any) => acc + (p.rewards ?? 0), 0);
        const stakedAmount = positions
          .filter((p: any) => p.status === "active" || p.status === "unlocked")
          .reduce((acc: number, p: any) => acc + p.amount, 0);

        setUserData((prev) => ({
          ...DEFAULT_USER_DATA,
          ...prev,
          ...payload,
          earnings: {
            ...DEFAULT_USER_DATA.earnings,
            ...(payload.earnings ?? {}),
          },
          usernames: Array.isArray(payload.usernames)
            ? payload.usernames
            : prev.usernames,
          stakingPositions: positions,
          stakingRewards,
          stakedAmount,
          activity: Array.isArray(payload.activity)
            ? payload.activity
            : prev.activity,
        }));

        if (payload.activeUsername)
          setActiveUsernameState(payload.activeUsername);
        if (payload.customization) {
          setCustomization({
            ...DEFAULT_CUSTOMIZATION,
            ...payload.customization,
          });
        }
      } catch (err) {
        console.error("[useDashboard] fetchUserData error:", err);
      }
    },
    [fetchStakingPositions],
  );

  const refreshUserData = useCallback(async () => {
    await fetchUserData(wallet, session);
    if (wallet) await fetchBalance(wallet);
  }, [wallet, session, fetchUserData, fetchBalance]);

  // ── Init — runs ONCE when session resolves, never again ───────────────────
  useEffect(() => {
    // Still waiting for NextAuth to resolve — don't do anything yet
    if (status === "loading") return;

    // FIX: Only run init once per component mount using a ref.
    // Previously the dep array included `session` which gets a new object
    // reference on every render (even with refetchOnWindowFocus=false),
    // causing init() to fire every time you switched back to this tab.
    if (initDone.current) return;
    initDone.current = true;

    const init = async () => {
      setLoading(true);
      try {
        if (session?.user) {
          setWallet(null);
          setBalance(0);
          const isGoogle = !!(
            session.user.image?.includes("google") ||
            session.user.image?.includes("googleusercontent")
          );
          setProvider(isGoogle ? "Google" : "Email");
          await fetchUserData(null, session);
          return;
        }

        const hasCustomJwt = document.cookie.includes("auth-token");

        if (hasCustomJwt) {
          const solana = (window as any).solana;
          if (solana?.isPhantom) {
            const resp = await solana
              .connect({ onlyIfTrusted: true })
              .catch(() => null);
            if (resp?.publicKey) {
              const pk = resp.publicKey.toString();
              setWallet(pk);
              setProvider("Phantom");
              setCustomization((prev) => ({
                ...prev,
                avatarSeed: prev.avatarSeed || pk,
              }));
              await Promise.all([fetchUserData(pk, null), fetchBalance(pk)]);
              return;
            }
          }
          await fetchUserData(null, { user: {} });
          return;
        }

        const solana = (window as any).solana;
        if (!solana?.isPhantom) {
          router.push("/login");
          return;
        }
        const resp = await solana
          .connect({ onlyIfTrusted: true })
          .catch(() => null);
        if (!resp?.publicKey) {
          router.push("/login");
          return;
        }
        const pk = resp.publicKey.toString();
        setWallet(pk);
        setProvider("Phantom");
        setCustomization((prev) => ({
          ...prev,
          avatarSeed: prev.avatarSeed || pk,
        }));
        await Promise.all([fetchUserData(pk, null), fetchBalance(pk)]);
      } finally {
        setLoading(false);
      }
    };

    init();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
  // ↑ Only depend on `status`, NOT `session`.
  // session is a new object reference on every render which was the root
  // cause of the full-page reload on tab focus.

  // ── Optimistic username stake toggle ───────────────────────────────────────
  const optimisticStakeUsername = useCallback(
    (username: string, staked: boolean) => {
      setUserData((prev) => ({
        ...prev,
        usernames: prev.usernames.map((u) => {
          const name = (u as any).username ?? u.name ?? "";
          return name === username ? { ...u, staked } : u;
        }),
      }));
    },
    [],
  );

  // ── Claim username ─────────────────────────────────────────────────────────
  const claimUsername = useCallback(
    async (username: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/username/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ username, wallet }),
        });
        const data = await res.json();
        if (!res.ok || !data.success)
          return { success: false, error: data.error ?? "Claim failed" };
        const newItem = {
          id: username,
          name: username,
          tier: data.tier,
          yield:
            data.tier === "Diamond"
              ? 5
              : data.tier === "Platinum"
                ? 3
                : data.tier === "Gold"
                  ? 1.5
                  : 0,
          value: data.price,
          expiresAt: new Date(Date.now() + 365 * 86_400_000).toISOString(),
          claimedAt: new Date().toISOString(),
          staked: false,
        };
        setUserData((prev) => ({
          ...prev,
          usernames: [...prev.usernames, newItem],
        }));
        refreshUserData();
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message ?? "Network error" };
      }
    },
    [wallet, refreshUserData],
  );

  // ── Set active username ────────────────────────────────────────────────────
  const setActiveUsername = useCallback(
    async (username: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/username/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ username, wallet }),
        });
        const data = await res.json();
        if (!res.ok || !data.success)
          return {
            success: false,
            error: data.error ?? "Failed to set username",
          };
        setActiveUsernameState(username);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message ?? "Network error" };
      }
    },
    [wallet],
  );

  // ── List username for sale ─────────────────────────────────────────────────
  const listUsername = useCallback(
    async (
      username: string,
      price: number,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/marketplace/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ username, price, wallet }),
        });
        const data = await res.json();
        if (!res.ok || !data.success)
          return { success: false, error: data.error ?? "Failed to list" };
        await refreshUserData();
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message ?? "Network error" };
      }
    },
    [wallet, refreshUserData],
  );

  // ── Delist username ────────────────────────────────────────────────────────
  const delistUsername = useCallback(
    async (username: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/marketplace/delist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ username, wallet }),
        });
        const data = await res.json();
        if (!res.ok || !data.success)
          return { success: false, error: data.error ?? "Failed to delist" };
        await refreshUserData();
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message ?? "Network error" };
      }
    },
    [wallet, refreshUserData],
  );

  // ── Save customization ─────────────────────────────────────────────────────
  const saveCustomization = useCallback(
    async (c: ProfileCustomization): Promise<void> => {
      setCustomization(c);
      try {
        await fetch("/api/user/customization", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ ...c, wallet }),
        });
      } catch (err) {
        console.error("[useDashboard] saveCustomization error:", err);
      }
    },
    [wallet],
  );

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (session) {
      await signOut({ callbackUrl: "/login" });
    } else {
      try {
        await (window as any).solana?.disconnect();
      } catch {}
      setWallet(null);
      router.push("/login");
    }
  }, [session, router]);

  // ── Display name ───────────────────────────────────────────────────────────
  const displayName = activeUsername
    ? activeUsername
    : session?.user?.name
      ? session.user.name
      : wallet
        ? `${wallet.slice(0, 4)}…${wallet.slice(-4)}`
        : "User";

  return {
    activeTab,
    setActiveTab,
    userData,
    loading,
    balance,
    wallet,
    provider,
    session,
    displayName,
    activeUsername,
    customization,
    claimUsername,
    setActiveUsername,
    listUsername,
    delistUsername,
    saveCustomization,
    refreshUserData,
    optimisticStakeUsername,
    logout,
  };
}
