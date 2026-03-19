"use client";
// app/profile/page.tsx

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Copy,
  Check,
  ExternalLink,
  Wallet,
  Edit3,
  Save,
  X,
  Crown,
  Zap,
  TrendingUp,
  Users,
  Shield,
  ChevronRight,
  RefreshCw,
  Loader2,
  ArrowLeft,
  Clock,
  Gift,
  Layers,
  BarChart2,
  Star,
  Activity,
  Camera,
  ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check as CheckIcon,
  Pencil,
  Trash2,
} from "lucide-react";
import { useDashboard } from "@/hook/useDashboard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import type { Notification } from "@/components/dashboard/DashboardHeader";
import type { UsernameItem, ActivityItem } from "@/types/dashboard";

// ─── Pixel Avatar ──────────────────────────────────────────────────────────────
function PixelAvatar({
  seed,
  size = 80,
  themeColor = "#2dd4bf",
}: {
  seed: string;
  size?: number;
  themeColor?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !seed) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const G = 8;
    canvas.width = G;
    canvas.height = G;
    let h = 0;
    for (let i = 0; i < seed.length; i++)
      h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
    const rand = (n: number) => {
      h = (Math.imul(1664525, h) + 1013904223) | 0;
      return Math.abs(h) % n;
    };
    const hue = rand(360);
    const hue2 = (hue + 40 + rand(80)) % 360;
    ctx.fillStyle = `hsl(${hue},60%,8%)`;
    ctx.fillRect(0, 0, G, G);
    for (let y = 0; y < G; y++)
      for (let x = 0; x < Math.ceil(G / 2); x++) {
        if (rand(3) !== 0) {
          ctx.fillStyle =
            rand(4) === 0
              ? themeColor
              : `hsl(${x % 2 === 0 ? hue : hue2},65%,${40 + rand(35)}%)`;
          ctx.fillRect(x, y, 1, 1);
          ctx.fillRect(G - 1 - x, y, 1, 1);
        }
      }
    ctx.fillStyle = "#fff";
    ctx.fillRect(2, 2, 1, 1);
    ctx.fillRect(5, 2, 1, 1);
  }, [seed, themeColor]);
  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        imageRendering: "pixelated",
        borderRadius: "50%",
      }}
    />
  );
}

// ─── Image Crop Modal ──────────────────────────────────────────────────────────
function ImageCropModal({
  src,
  aspectRatio = 1,
  circular = false,
  onSave,
  onClose,
  title = "Crop Image",
}: {
  src: string;
  aspectRatio?: number;
  circular?: boolean;
  onSave: (blob: Blob) => void;
  onClose: () => void;
  title?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });

  const PREVIEW_W = aspectRatio >= 1 ? 320 : Math.round(320 * aspectRatio);
  const PREVIEW_H = aspectRatio <= 1 ? 320 : Math.round(320 / aspectRatio);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      const fitScale = Math.max(
        PREVIEW_W / img.naturalWidth,
        PREVIEW_H / img.naturalHeight,
      );
      setScale(fitScale);
      setOffset({ x: 0, y: 0 });
      setImgLoaded(true);
    };
    img.src = src;
  }, [src, PREVIEW_W, PREVIEW_H]);

  useEffect(() => {
    if (!imgLoaded || !canvasRef.current || !imgRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    canvasRef.current.width = PREVIEW_W;
    canvasRef.current.height = PREVIEW_H;
    ctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H);
    if (circular) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        PREVIEW_W / 2,
        PREVIEW_H / 2,
        Math.min(PREVIEW_W, PREVIEW_H) / 2,
        0,
        Math.PI * 2,
      );
      ctx.clip();
    }
    const drawW = naturalSize.w * scale;
    const drawH = naturalSize.h * scale;
    const drawX = (PREVIEW_W - drawW) / 2 + offset.x;
    const drawY = (PREVIEW_H - drawH) / 2 + offset.y;
    ctx.drawImage(imgRef.current, drawX, drawY, drawW, drawH);
    if (circular) ctx.restore();
  }, [imgLoaded, scale, offset, naturalSize, PREVIEW_W, PREVIEW_H, circular]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setDragging(false);
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setDragging(true);
    setDragStart({ x: t.clientX - offset.x, y: t.clientY - offset.y });
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    const t = e.touches[0];
    setOffset({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
  };

  const handleSave = () => {
    if (!canvasRef.current || !imgRef.current) return;
    const outputCanvas = document.createElement("canvas");
    const outW = circular ? 400 : 1200;
    const outH = circular ? 400 : Math.round(1200 / aspectRatio);
    outputCanvas.width = outW;
    outputCanvas.height = outH;
    const octx = outputCanvas.getContext("2d");
    if (!octx) return;
    const scaleRatio = outW / PREVIEW_W;
    if (circular) {
      octx.save();
      octx.beginPath();
      octx.arc(outW / 2, outH / 2, outW / 2, 0, Math.PI * 2);
      octx.clip();
    }
    const drawW = naturalSize.w * scale * scaleRatio;
    const drawH = naturalSize.h * scale * scaleRatio;
    const drawX = (outW - drawW) / 2 + offset.x * scaleRatio;
    const drawY = (outH - drawH) / 2 + offset.y * scaleRatio;
    octx.drawImage(imgRef.current, drawX, drawY, drawW, drawH);
    if (circular) octx.restore();
    outputCanvas.toBlob(
      (blob) => {
        if (blob) onSave(blob);
      },
      "image/jpeg",
      0.88,
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#0a0f1a] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <p className="text-sm font-semibold text-white">{title}</p>
          <button
            onClick={onClose}
            className="p-1.5 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex justify-center">
            <div
              className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-black/40"
              style={{
                width: PREVIEW_W,
                height: PREVIEW_H,
                cursor: dragging ? "grabbing" : "grab",
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
            >
              <canvas
                ref={canvasRef}
                style={{
                  display: "block",
                  width: PREVIEW_W,
                  height: PREVIEW_H,
                }}
              />
              {circular && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    boxShadow: "inset 0 0 0 9999px rgba(0,0,0,0.5)",
                    borderRadius: "50%",
                  }}
                />
              )}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute left-1/3 top-0 bottom-0 border-l border-white/30" />
                <div className="absolute left-2/3 top-0 bottom-0 border-l border-white/30" />
                <div className="absolute top-1/3 left-0 right-0 border-t border-white/30" />
                <div className="absolute top-2/3 left-0 right-0 border-t border-white/30" />
              </div>
            </div>
          </div>
          <p className="text-[11px] text-white/30 text-center">
            Drag to reposition
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setScale((s) => Math.max(0.1, s - 0.1))}
              className="p-2 rounded-lg border border-white/[0.07] text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="flex-1">
              <input
                type="range"
                min="0.1"
                max="4"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full accent-teal-400"
              />
            </div>
            <button
              onClick={() => setScale((s) => Math.min(4, s + 0.1))}
              className="p-2 rounded-lg border border-white/[0.07] text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const fitScale = Math.max(
                  PREVIEW_W / naturalSize.w,
                  PREVIEW_H / naturalSize.h,
                );
                setScale(fitScale);
                setOffset({ x: 0, y: 0 });
              }}
              className="p-2 rounded-lg border border-white/[0.07] text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-white/[0.07] text-sm text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400 text-sm font-medium hover:bg-teal-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckIcon className="w-4 h-4" /> Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Cover Options Menu ────────────────────────────────────────────────────────
function CoverMenu({
  onEdit,
  onRemove,
  onClose,
}: {
  onEdit: () => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-[49]" onClick={onClose} />
      <div className="absolute top-12 right-3 z-50 w-48 rounded-2xl border border-white/[0.08] bg-[#0d1525] shadow-2xl overflow-hidden">
        <button
          onClick={() => {
            onEdit();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:bg-white/[0.06] hover:text-white transition-all cursor-pointer"
        >
          <Camera className="h-4 w-4" /> Change cover photo
        </button>
        <div className="h-px bg-white/[0.06]" />
        <button
          onClick={() => {
            onRemove();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400/80 hover:bg-red-500/[0.08] hover:text-red-400 transition-all cursor-pointer"
        >
          <Trash2 className="h-4 w-4" /> Remove cover photo
        </button>
      </div>
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const THEME_COLORS: Record<string, string> = {
  teal: "#2dd4bf",
  violet: "#a78bfa",
  rose: "#fb7185",
  amber: "#fbbf24",
  cyan: "#22d3ee",
  lime: "#a3e635",
  pink: "#f472b6",
  white: "#e2e8f0",
};
const XP_TIERS = [
  { min: 0, label: "Observer", hex: "#64748b" },
  { min: 100, label: "Recruiter", hex: "#22d3ee" },
  { min: 500, label: "Resolver", hex: "#a78bfa" },
  { min: 1000, label: "Architect", hex: "#2dd4bf" },
  { min: 5000, label: "Sovereign", hex: "#fbbf24" },
];
const TIER_HEX: Record<string, string> = {
  Diamond: "#22d3ee",
  Platinum: "#a78bfa",
  Gold: "#fbbf24",
  Silver: "#94a3b8",
  Bronze: "#b45309",
};
const ACT_CONFIG: Record<string, { icon: any; color: string }> = {
  claim: { icon: Crown, color: "#2dd4bf" },
  staking: { icon: Zap, color: "#a78bfa" },
  referral: { icon: Gift, color: "#22d3ee" },
  received: { icon: TrendingUp, color: "#34d399" },
  sent: { icon: ArrowLeft, color: "#fb7185" },
  unstake: { icon: Activity, color: "#fbbf24" },
  reward: { icon: Star, color: "#f472b6" },
};

// ─── Upload helper ─────────────────────────────────────────────────────────────
async function uploadImageBlob(
  blob: Blob,
  type: "avatar" | "cover",
): Promise<string> {
  const fd = new FormData();
  fd.append("file", blob, `${type}.jpg`);
  fd.append("type", type);
  const res = await fetch("/api/user/upload-image", {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? "Upload failed");
  return data.url as string;
}

// ─── Save customization — uses EXPLICIT values, never reads stale hook state ──
async function saveCustomization(payload: {
  theme: string;
  petId: string;
  avatarSeed: string;
  avatarImage: string | null;
  coverPhoto: string | null;
  bio: string;
}) {
  const res = await fetch("/api/user/customization", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const dash = useDashboard();
  const [notifications] = useState<Notification[]>([]);

  // ── Local mirror of persisted values ──
  // These are the GROUND TRUTH for saves — never read dash.customization in save calls
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(null);
  const [currentBio, setCurrentBio] = useState("");

  // ── Derived from dash — only used for display base values before hydration ──
  const themeColor =
    THEME_COLORS[dash.customization?.theme ?? "teal"] ?? "#2dd4bf";
  const avatarSeed =
    dash.customization?.avatarSeed || dash.displayName || "vyns";
  const currentTheme = (dash.customization as any)?.theme ?? "teal";
  const currentPetId = (dash.customization as any)?.petId ?? "none";
  const currentAvatarSeed = (dash.customization as any)?.avatarSeed ?? "";

  // Hydrate local state once — only after loading finishes so we get real DB values
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    if (dash.loading) return; // wait for real data from API
    hydratedRef.current = true;
    const c = dash.customization as any;
    if (c?.avatarImage) setCurrentAvatarUrl(c.avatarImage);
    if (c?.coverPhoto) setCurrentCoverUrl(c.coverPhoto);
    const b = (dash.userData as any)?.bio ?? "";
    if (b) setCurrentBio(b);
  }, [dash.loading, dash.customization, dash.userData]);

  // Bio
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [savingBio, setSavingBio] = useState(false);

  // Avatar
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropType, setCropType] = useState<"avatar" | "cover">("avatar");
  const [savingAvatar, setSavingAvatar] = useState(false);

  // Cover
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [savingCover, setSavingCover] = useState(false);
  const [showCoverMenu, setShowCoverMenu] = useState(false);

  // Wallet
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [balLoading, setBalLoading] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const xp = dash.userData.xp ?? 0;
  const xpTier =
    [...XP_TIERS].reverse().find((t) => xp >= t.min) ?? XP_TIERS[0];
  const nextTier = XP_TIERS.find((t) => t.min > xp) ?? null;
  const xpProgress = nextTier
    ? ((xp - xpTier.min) / (nextTier.min - xpTier.min)) * 100
    : 100;

  const usernames: UsernameItem[] = dash.userData.usernames ?? [];
  const activity: ActivityItem[] = dash.userData.activity ?? [];
  const referralCode = dash.userData.referralCode ?? "";
  const totalEarnings = dash.userData.earnings?.allTime ?? 0;
  const stakedAmount = dash.userData.stakedAmount ?? 0;
  const stakingRewards = dash.userData.stakingRewards ?? 0;
  const referralCount = dash.userData.referrals ?? 0;
  const positions = dash.userData.stakingPositions ?? [];
  const activePositions = positions.filter(
    (p: any) => p.status === "active",
  ).length;

  const fetchBalance = useCallback(async () => {
    if (!dash.wallet) return;
    setBalLoading(true);
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
          params: [dash.wallet],
        }),
      });
      const data = await res.json();
      setSolBalance(data.result?.value ? data.result.value / 1e9 : 0);
    } catch {
      setSolBalance(0);
    }
    setBalLoading(false);
  }, [dash.wallet]);

  useEffect(() => {
    if (dash.wallet) fetchBalance();
  }, [dash.wallet, fetchBalance]);

  // ── Build save payload from LOCAL state (never stale hook state) ────────────
  const buildPayload = useCallback(
    (
      overrides: Partial<{
        avatarImage: string | null;
        coverPhoto: string | null;
        bio: string;
      }> = {},
    ) => ({
      theme: currentTheme,
      petId: currentPetId,
      avatarSeed: currentAvatarSeed,
      avatarImage:
        "avatarImage" in overrides ? overrides.avatarImage! : currentAvatarUrl,
      coverPhoto:
        "coverPhoto" in overrides ? overrides.coverPhoto! : currentCoverUrl,
      bio: "bio" in overrides ? overrides.bio! : currentBio,
    }),
    [
      currentTheme,
      currentPetId,
      currentAvatarSeed,
      currentAvatarUrl,
      currentCoverUrl,
      currentBio,
    ],
  );

  // ── Bio ──
  const saveBio = async () => {
    setSavingBio(true);
    try {
      await saveCustomization(buildPayload({ bio: bioInput.trim() }));
      setCurrentBio(bioInput.trim());
      setEditingBio(false);
    } catch {}
    setSavingBio(false);
  };

  // ── Avatar file select ──
  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropType("avatar");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Avatar crop save ──
  const handleAvatarCropSave = async (blob: Blob) => {
    setCropSrc(null);
    setSavingAvatar(true);
    const localPreview = URL.createObjectURL(blob);
    setCurrentAvatarUrl(localPreview); // optimistic
    try {
      const cdnUrl = await uploadImageBlob(blob, "avatar");

      // Clean up old CDN blob
      const oldUrl = (dash.customization as any)?.avatarImage;
      if (oldUrl && oldUrl.includes("vercel-storage.com")) {
        fetch("/api/user/upload-image", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ url: oldUrl }),
        }).catch(() => {});
      }

      // Update local state to CDN URL, then save with that exact value
      setCurrentAvatarUrl(cdnUrl);
      URL.revokeObjectURL(localPreview);

      // Save with explicit cdnUrl — never reads stale state
      await saveCustomization(buildPayload({ avatarImage: cdnUrl }));
    } catch (err) {
      console.error("[avatar upload]", err);
      setCurrentAvatarUrl(currentAvatarUrl); // revert on error
    }
    setSavingAvatar(false);
  };

  // ── Cover file select ──
  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropType("cover");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Cover crop save ──
  const handleCoverCropSave = async (blob: Blob) => {
    setCropSrc(null);
    setSavingCover(true);
    const localPreview = URL.createObjectURL(blob);
    setCurrentCoverUrl(localPreview); // optimistic
    try {
      const cdnUrl = await uploadImageBlob(blob, "cover");

      const oldUrl = (dash.customization as any)?.coverPhoto;
      if (oldUrl && oldUrl.includes("vercel-storage.com")) {
        fetch("/api/user/upload-image", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ url: oldUrl }),
        }).catch(() => {});
      }

      setCurrentCoverUrl(cdnUrl);
      URL.revokeObjectURL(localPreview);

      await saveCustomization(buildPayload({ coverPhoto: cdnUrl }));
    } catch (err) {
      console.error("[cover upload]", err);
    }
    setSavingCover(false);
  };

  // ── Remove cover ──
  const removeCover = async () => {
    const oldUrl = currentCoverUrl;
    setCurrentCoverUrl(null);
    if (oldUrl && oldUrl.includes("vercel-storage.com")) {
      fetch("/api/user/upload-image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url: oldUrl }),
      }).catch(() => {});
    }
    await saveCustomization(buildPayload({ coverPhoto: null }));
  };

  const copyWallet = () => {
    if (!dash.wallet) return;
    navigator.clipboard.writeText(dash.wallet);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };
  const copyRef = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const showCustomAvatar = !!currentAvatarUrl;
  const showOAuthAvatar = !!dash.session?.user?.image && !showCustomAvatar;

  if (dash.loading) {
    return (
      <div className="min-h-screen bg-[#060b14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-400/40" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060b14] text-white overflow-x-hidden">
      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          aspectRatio={cropType === "avatar" ? 1 : 3}
          circular={cropType === "avatar"}
          title={
            cropType === "avatar" ? "Crop Profile Photo" : "Crop Cover Photo"
          }
          onSave={
            cropType === "avatar" ? handleAvatarCropSave : handleCoverCropSave
          }
          onClose={() => setCropSrc(null)}
        />
      )}

      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFileSelect}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCoverFileSelect}
      />

      <div
        className="fixed top-0 left-0 w-[700px] h-[400px] pointer-events-none blur-[140px] -translate-x-1/2 -translate-y-1/2 z-0"
        style={{ background: `${themeColor}08` }}
      />
      <div
        className="fixed bottom-0 right-0 w-[500px] h-[400px] pointer-events-none blur-[120px] translate-x-1/3 translate-y-1/3 z-0"
        style={{ background: "rgba(99,102,241,0.06)" }}
      />

      <div className="relative z-10">
        <DashboardHeader
          session={dash.session}
          wallet={dash.wallet}
          provider={dash.provider}
          displayName={dash.displayName}
          activeUsername={dash.activeUsername}
          customization={
            {
              ...(dash.customization ?? {}),
              avatarImage: currentAvatarUrl,
            } as any
          }
          notifications={notifications}
          sidebarOpen={false}
          onToggleSidebar={() => {}}
          onMarkNotifsRead={() => {}}
          onOpenSettings={() => router.push("/settings")}
          onLogout={dash.logout}
          onWalletLinked={(pk) => dash.setWallet(pk || null)}
          onOpenProfile={() => {}}
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          {/* ── HERO ── */}
          <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
            {/* Cover photo */}
            <div
              className="relative h-32 sm:h-44 overflow-visible group"
              style={
                currentCoverUrl
                  ? {
                      backgroundImage: `url(${currentCoverUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : {
                      background: `linear-gradient(130deg, #07101f 0%, ${themeColor}1a 55%, #0b1628 100%)`,
                    }
              }
            >
              {!currentCoverUrl && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.035) 1px, transparent 0)",
                    backgroundSize: "24px 24px",
                  }}
                />
              )}
              {currentCoverUrl && (
                <div className="absolute inset-0 bg-black/10" />
              )}

              {/* Tier badge — top left */}
              <div
                className="absolute top-3 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold tracking-wide z-10"
                style={{
                  borderColor: `${xpTier.hex}35`,
                  background: `${xpTier.hex}12`,
                  color: xpTier.hex,
                }}
              >
                <Shield className="h-3 w-3" />
                {xpTier.label}
              </div>

              {/* Cover edit button — top right, always visible */}
              <div className="absolute top-3 right-3 z-20">
                {savingCover ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white/50">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() =>
                        currentCoverUrl
                          ? setShowCoverMenu((v) => !v)
                          : coverInputRef.current?.click()
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white/70 hover:text-white hover:bg-black/80 transition-all cursor-pointer backdrop-blur-sm"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      {currentCoverUrl ? "Edit cover" : "Add cover photo"}
                    </button>
                    {showCoverMenu && currentCoverUrl && (
                      <CoverMenu
                        onEdit={() => coverInputRef.current?.click()}
                        onRemove={removeCover}
                        onClose={() => setShowCoverMenu(false)}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Profile info row */}
            <div className="bg-[#060b14] px-5 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12">
                {/* Avatar with camera overlay */}
                <div className="relative shrink-0 z-10">
                  <button
                    className="group relative block cursor-pointer"
                    onClick={() => avatarInputRef.current?.click()}
                    title="Change profile photo"
                  >
                    <div
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-[3px] border-[#060b14] overflow-hidden transition-all"
                      style={{
                        boxShadow: `0 0 0 1px ${themeColor}25, 0 0 24px ${themeColor}18`,
                      }}
                    >
                      {savingAvatar ? (
                        <div className="w-full h-full bg-black/60 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 text-teal-400 animate-spin" />
                        </div>
                      ) : showCustomAvatar ? (
                        <img
                          src={currentAvatarUrl!}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : showOAuthAvatar ? (
                        <Image
                          src={dash.session?.user?.image ?? ""}
                          alt="avatar"
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <PixelAvatar
                          seed={avatarSeed}
                          size={96}
                          themeColor={themeColor}
                        />
                      )}
                    </div>
                    {/* Camera overlay — only on hover */}
                    <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center gap-0.5 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <Camera className="h-5 w-5 text-white" />
                      <span className="text-[10px] text-white/90 font-medium">
                        Edit
                      </span>
                    </div>
                  </button>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#060b14]" />
                </div>

                {/* Name + actions */}
                <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:pb-1">
                  <div className="space-y-0.5">
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-none">
                      {dash.displayName}
                    </h1>
                    {dash.activeUsername && (
                      <p
                        className="text-sm font-mono"
                        style={{ color: themeColor }}
                      >
                        @{dash.activeUsername}
                      </p>
                    )}
                    {dash.session?.user?.email && (
                      <p className="text-xs text-white/25">
                        {dash.session.user.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio — inline edit like Facebook */}
              <div className="mt-4 ml-0 sm:ml-1 max-w-lg">
                {editingBio ? (
                  <div className="space-y-2">
                    <textarea
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      maxLength={160}
                      placeholder="Tell people a bit about yourself…"
                      rows={2}
                      autoFocus
                      className="w-full px-3 py-2 rounded-xl border border-teal-500/30 bg-white/[0.04] text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-white/25">
                        {bioInput.length}/160
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingBio(false)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/[0.08] text-xs text-white/40 hover:text-white/60 transition-all cursor-pointer"
                        >
                          <X className="h-3 w-3" /> Cancel
                        </button>
                        <button
                          onClick={saveBio}
                          disabled={savingBio}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs font-medium hover:bg-teal-500/30 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {savingBio ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Save className="h-3 w-3" />
                          )}{" "}
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setBioInput(currentBio);
                      setEditingBio(true);
                    }}
                    className="group flex items-start gap-2 text-sm cursor-pointer w-full text-left"
                  >
                    <span
                      className={
                        currentBio
                          ? "text-white/50 leading-relaxed"
                          : "italic text-white/20"
                      }
                    >
                      {currentBio || "Add a bio…"}
                    </span>
                    <Edit3 className="h-3.5 w-3.5 text-white/20 group-hover:text-teal-400 transition-colors shrink-0 mt-0.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── STATS ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                icon: Crown,
                label: "Usernames",
                value: usernames.length,
                accent: themeColor,
              },
              {
                icon: TrendingUp,
                label: "All-time",
                value: `${totalEarnings.toFixed(3)} SOL`,
                accent: "#34d399",
              },
              {
                icon: Zap,
                label: "Staked",
                value: `${stakedAmount.toFixed(2)} SOL`,
                accent: "#a78bfa",
              },
              {
                icon: Users,
                label: "Referrals",
                value: referralCount,
                accent: "#22d3ee",
              },
            ].map(({ icon: Icon, label, value, accent }) => (
              <div
                key={label}
                className="relative group rounded-xl border border-white/[0.05] bg-white/[0.015] p-4 overflow-hidden hover:border-white/[0.1] transition-all"
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${accent}09, transparent 65%)`,
                  }}
                />
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: accent }}
                  />
                  <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium">
                    {label}
                  </span>
                </div>
                <p className="text-xl font-bold text-white tabular-nums leading-none">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* ── MAIN GRID ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="space-y-4">
              {/* Wallet */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#060b14] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Wallet
                      className="h-3.5 w-3.5"
                      style={{ color: themeColor }}
                    />
                    <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium">
                      Wallet
                    </span>
                  </div>
                  {dash.wallet && (
                    <button
                      onClick={fetchBalance}
                      className="text-white/20 hover:text-white/50 transition-colors cursor-pointer"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${balLoading ? "animate-spin" : ""}`}
                      />
                    </button>
                  )}
                </div>
                {dash.wallet ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.025] border border-white/[0.05]">
                      <span className="flex-1 text-xs font-mono text-white/35 truncate">
                        {dash.wallet.slice(0, 8)}…{dash.wallet.slice(-6)}
                      </span>
                      <button
                        onClick={copyWallet}
                        className="shrink-0 text-white/20 hover:text-white/55 transition-colors cursor-pointer"
                      >
                        {copiedWallet ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <a
                        href={`https://solscan.io/account/${dash.wallet}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-white/20 hover:text-white/55 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                    <div className="text-center py-1">
                      {balLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-white/20 mx-auto" />
                      ) : (
                        <>
                          <p className="text-3xl font-bold text-white tabular-nums">
                            {(solBalance ?? 0).toFixed(4)}
                          </p>
                          <p className="text-[11px] text-white/20 mt-0.5">
                            SOL · Mainnet
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span className="text-[11px] text-white/20">
                        via {dash.provider}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center space-y-2">
                    <Wallet className="h-8 w-8 mx-auto text-white/10" />
                    <p className="text-xs text-white/25">No wallet connected</p>
                    <button
                      onClick={() => router.push("/dashboard")}
                      className="text-xs px-3 py-1.5 rounded-lg border border-white/[0.07] text-white/35 hover:text-white/60 hover:bg-white/[0.04] transition-all cursor-pointer"
                    >
                      Connect from dashboard
                    </button>
                  </div>
                )}
              </div>

              {/* Referral */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#060b14] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Gift className="h-3.5 w-3.5 text-sky-400" />
                  <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium">
                    Referral Code
                  </span>
                </div>
                {referralCode ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-sky-500/[0.08] border border-sky-500/[0.15]">
                      <span className="flex-1 text-sm font-mono font-bold text-sky-300 tracking-widest">
                        {referralCode}
                      </span>
                      <button
                        onClick={copyRef}
                        className="shrink-0 text-sky-400/50 hover:text-sky-400 transition-colors cursor-pointer"
                      >
                        {copiedRef ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-white/20 text-center">
                      {referralCount} user{referralCount !== 1 ? "s" : ""}{" "}
                      referred
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-white/20 text-center py-2">
                    No referral code yet
                  </p>
                )}
              </div>

              {/* Auth badge */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#060b14] px-4 py-3 flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: `${themeColor}12`,
                    border: `1px solid ${themeColor}20`,
                  }}
                >
                  <Shield className="h-4 w-4" style={{ color: themeColor }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-white/25 uppercase tracking-wider">
                    Auth provider
                  </p>
                  <p className="text-sm font-medium text-white/70">
                    {dash.provider}
                  </p>
                </div>
                <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              </div>
            </div>

            {/* Right col */}
            <div className="lg:col-span-2 space-y-4">
              {/* Usernames */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#060b14] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers
                      className="h-3.5 w-3.5"
                      style={{ color: themeColor }}
                    />
                    <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium">
                      Registered Names
                    </span>
                    {usernames.length > 0 && (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: `${themeColor}15`,
                          color: themeColor,
                        }}
                      >
                        {usernames.length}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-1 text-[11px] text-white/20 hover:text-white/45 transition-colors cursor-pointer"
                  >
                    Manage <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                {usernames.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {usernames.map((u) => {
                      const hex = TIER_HEX[u.tier] ?? "#64748b";
                      return (
                        <div
                          key={u.id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white/[0.02]"
                          style={{ borderColor: `${hex}25` }}
                        >
                          <span className="text-xs font-mono text-white/60">
                            @{u.name}
                          </span>
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{ background: `${hex}18`, color: hex }}
                          >
                            {u.tier}
                          </span>
                          {u.staked && (
                            <Zap
                              className="h-3 w-3 shrink-0"
                              style={{ color: hex }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-2">
                    <Crown className="h-8 w-8 mx-auto text-white/[0.07]" />
                    <p className="text-sm text-white/20">
                      No usernames registered yet
                    </p>
                    <button
                      onClick={() => router.push("/dashboard")}
                      className="text-xs px-3 py-1.5 rounded-lg border text-teal-400 border-teal-500/20 bg-teal-500/10 hover:bg-teal-500/20 transition-all cursor-pointer"
                    >
                      Claim your first name
                    </button>
                  </div>
                )}
              </div>

              {/* Staking */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#060b14] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium">
                      Staking
                    </span>
                  </div>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-1 text-[11px] text-white/20 hover:text-white/45 transition-colors cursor-pointer"
                  >
                    View <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      label: "Active",
                      value: activePositions,
                      accent: "#34d399",
                    },
                    {
                      label: "Staked",
                      value: `${stakedAmount.toFixed(2)} SOL`,
                      accent: "#a78bfa",
                    },
                    {
                      label: "Rewards",
                      value: `${stakingRewards.toFixed(4)}`,
                      accent: "#fbbf24",
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 text-center"
                    >
                      <p className="text-base font-bold text-white leading-none">
                        {value}
                      </p>
                      <p className="text-[10px] text-white/25 mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#060b14] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-3.5 w-3.5 text-white/25" />
                  <span className="text-[10px] uppercase tracking-widest text-white/25 font-medium">
                    Recent Activity
                  </span>
                </div>
                {activity.length > 0 ? (
                  <div>
                    {activity.slice(0, 8).map((a, i) => {
                      const cfg = ACT_CONFIG[a.type] ?? {
                        icon: Star,
                        color: "#64748b",
                      };
                      const Icon = cfg.icon;
                      return (
                        <div
                          key={a.id ?? i}
                          className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0"
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: `${cfg.color}12` }}
                          >
                            <Icon
                              className="h-3.5 w-3.5"
                              style={{ color: cfg.color }}
                            />
                          </div>
                          <p className="flex-1 text-xs text-white/55 truncate">
                            {a.description}
                          </p>
                          {a.amount !== 0 && (
                            <span
                              className="text-xs font-mono shrink-0"
                              style={{
                                color:
                                  a.type === "sent" ? "#fb7185" : "#34d399",
                              }}
                            >
                              {a.type === "sent" ? "-" : "+"}
                              {Math.abs(a.amount).toFixed(4)} {a.token}
                            </span>
                          )}
                          <span className="text-[10px] text-white/20 shrink-0 flex items-center gap-0.5 ml-1">
                            <Clock className="h-2.5 w-2.5" />
                            {new Date(a.date).toLocaleDateString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-2">
                    <Activity className="h-7 w-7 mx-auto text-white/[0.07]" />
                    <p className="text-sm text-white/20">No activity yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
