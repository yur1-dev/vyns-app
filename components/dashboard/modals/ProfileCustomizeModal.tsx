"use client";

// components/dashboard/modals/ProfileCustomizeModal.tsx

import { useState, useEffect, useRef } from "react";
import { X, Check, Sparkles, Palette, User, RefreshCw } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProfileCustomization {
  theme: string;
  petId: string;
  avatarSeed: string;
}

// ── Themes ────────────────────────────────────────────────────────────────────

const THEMES = [
  { id: "teal", label: "Teal", color: "#2dd4bf", glow: "rgba(45,212,191,0.4)" },
  {
    id: "violet",
    label: "Violet",
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.4)",
  },
  {
    id: "rose",
    label: "Rose",
    color: "#fb7185",
    glow: "rgba(251,113,133,0.4)",
  },
  {
    id: "amber",
    label: "Amber",
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.4)",
  },
  { id: "cyan", label: "Cyan", color: "#22d3ee", glow: "rgba(34,211,238,0.4)" },
  { id: "lime", label: "Lime", color: "#a3e635", glow: "rgba(163,230,53,0.4)" },
  {
    id: "pink",
    label: "Pink",
    color: "#f472b6",
    glow: "rgba(244,114,182,0.4)",
  },
  {
    id: "white",
    label: "Ghost",
    color: "#e2e8f0",
    glow: "rgba(226,232,240,0.3)",
  },
];

// ── Pixel Avatar ──────────────────────────────────────────────────────────────

export function PixelAvatar({
  seed,
  size = 64,
  themeColor = "#2dd4bf",
  rounded = false,
}: {
  seed: string;
  size?: number;
  themeColor?: string;
  rounded?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !seed) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const GRID = 8;
    canvas.width = GRID;
    canvas.height = GRID;
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
    ctx.fillRect(0, 0, GRID, GRID);
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < Math.ceil(GRID / 2); x++) {
        if (rand(3) !== 0) {
          const useTheme = rand(4) === 0;
          ctx.fillStyle = useTheme
            ? themeColor
            : `hsl(${x % 2 === 0 ? hue : hue2},65%,${40 + rand(35)}%)`;
          ctx.fillRect(x, y, 1, 1);
          ctx.fillRect(GRID - 1 - x, y, 1, 1);
        }
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
        borderRadius: rounded ? "50%" : 8,
      }}
    />
  );
}

// ── Pet Definitions (9×9 pixel grid, 3 frames) ────────────────────────────────
// 0=empty, 1=body, 2=accent/mouth, 3=eyes, 4=dark outline

export const PETS = [
  {
    id: "cat",
    label: "Cat",
    emoji: "🐱",
    frames: [
      // frame 0 — sitting
      [
        [0, 0, 1, 0, 0, 0, 1, 0, 0],
        [0, 0, 1, 4, 0, 4, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 3, 1, 1, 1, 3, 1, 0],
        [0, 1, 1, 2, 1, 2, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 0, 0, 0, 1, 1, 0],
        [0, 1, 0, 0, 0, 0, 0, 1, 0],
        [0, 1, 1, 0, 0, 0, 1, 1, 0],
      ],
      // frame 1 — tail up
      [
        [0, 0, 1, 0, 0, 0, 1, 0, 0],
        [0, 0, 1, 4, 0, 4, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 3, 1, 1, 1, 3, 1, 0],
        [0, 1, 1, 2, 1, 2, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 0, 0, 0, 1, 1, 1],
        [0, 1, 0, 0, 0, 0, 0, 0, 1],
        [0, 1, 1, 0, 0, 0, 1, 1, 0],
      ],
      // frame 2 — blink
      [
        [0, 0, 1, 0, 0, 0, 1, 0, 0],
        [0, 0, 1, 4, 0, 4, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 4, 1, 1, 1, 4, 1, 0],
        [0, 1, 1, 2, 1, 2, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 0, 0, 0, 1, 1, 0],
        [0, 1, 0, 0, 0, 0, 0, 1, 0],
        [0, 1, 1, 0, 0, 0, 1, 1, 0],
      ],
    ],
  },
  {
    id: "dog",
    label: "Dog",
    emoji: "🐶",
    frames: [
      [
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 4, 0, 0, 0, 4, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 3, 1, 1, 1, 3, 1, 0],
        [0, 1, 1, 1, 2, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 0, 0, 0, 1, 1, 0],
        [0, 1, 0, 0, 0, 0, 0, 1, 0],
        [0, 1, 1, 0, 0, 0, 1, 1, 0],
      ],
      [
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 4, 0, 0, 0, 4, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 3, 1, 1, 1, 3, 1, 0],
        [0, 1, 1, 2, 1, 2, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 0, 0, 0, 1, 1, 0],
        [0, 1, 0, 0, 0, 0, 0, 1, 0],
        [0, 1, 1, 0, 0, 0, 1, 1, 0],
      ],
      [
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 4, 0, 0, 0, 4, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 3, 1, 1, 1, 3, 1, 0],
        [0, 1, 1, 1, 2, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 0, 0, 0, 1, 1, 0],
        [0, 1, 0, 0, 0, 0, 0, 1, 0],
        [0, 1, 1, 0, 0, 0, 1, 1, 0],
      ],
    ],
  },
  {
    id: "ghost",
    label: "Ghost",
    emoji: "👻",
    frames: [
      [
        [0, 0, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 3, 1, 1, 1, 3, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 2, 1, 2, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 1, 1, 1, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 3, 1, 3, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 2, 1, 2, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 0, 1, 0, 1, 0, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      [
        [0, 0, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 4, 1, 1, 1, 4, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 2, 1, 2, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
    ],
  },
  {
    id: "robot",
    label: "Robot",
    emoji: "🤖",
    frames: [
      [
        [0, 0, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 1, 0, 1, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 3, 1, 2, 1, 3, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 0, 1, 0, 1, 1, 0],
        [0, 1, 0, 0, 1, 0, 0, 1, 0],
        [0, 1, 1, 0, 1, 0, 1, 1, 0],
      ],
      [
        [0, 0, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 1, 0, 1, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 2, 1, 1, 1, 2, 1, 0],
        [0, 1, 1, 3, 1, 3, 1, 1, 0],
        [0, 0, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 0, 1, 0, 1, 1, 0],
        [0, 1, 0, 0, 1, 0, 0, 1, 0],
        [0, 1, 1, 0, 0, 0, 1, 1, 0],
      ],
      [
        [0, 0, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 2, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 3, 1, 1, 1, 3, 1, 0],
        [0, 1, 1, 2, 1, 2, 1, 1, 0],
        [0, 0, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 0, 1, 0, 1, 1, 0],
        [0, 1, 0, 0, 1, 0, 0, 1, 0],
        [0, 1, 1, 0, 1, 0, 1, 1, 0],
      ],
    ],
  },
  {
    id: "dragon",
    label: "Dragon",
    emoji: "🐲",
    frames: [
      [
        [0, 1, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 3, 1, 1, 1, 3, 1, 0],
        [1, 1, 1, 2, 1, 2, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 0, 0, 1, 0, 0, 1, 0],
        [1, 0, 0, 0, 1, 0, 0, 0, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      [
        [1, 0, 0, 0, 0, 0, 0, 0, 1],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 3, 1, 1, 1, 3, 1, 0],
        [0, 1, 1, 2, 1, 2, 1, 1, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 0, 0, 1, 0, 0, 1, 0],
        [0, 0, 1, 0, 1, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      [
        [0, 1, 0, 0, 2, 0, 0, 1, 0],
        [0, 0, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 4, 1, 1, 1, 4, 1, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 2, 1, 2, 1, 1, 0],
        [0, 0, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 0, 0, 1, 0, 0, 1, 0],
        [1, 0, 0, 0, 1, 0, 0, 0, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
    ],
  },
  {
    id: "alien",
    label: "Alien",
    emoji: "👽",
    frames: [
      [
        [0, 0, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 3, 1, 1, 1, 3, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 2, 1, 2, 1, 1, 0],
        [0, 0, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 1, 0, 1, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 1, 1, 1, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 3, 1, 3, 1, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 1, 2, 1, 2, 1, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 1, 0, 1, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      [
        [0, 0, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 4, 1, 1, 1, 4, 1, 1],
        [1, 1, 1, 2, 1, 2, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 1, 1, 1, 1, 1, 0, 0],
        [0, 0, 0, 1, 0, 1, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
    ],
  },
  { id: "none", label: "None", emoji: "✕", frames: [] },
];

// ── PetCanvas ─────────────────────────────────────────────────────────────────

export function PetCanvas({
  pet,
  themeColor,
  size = 40,
  animating = false,
}: {
  pet: (typeof PETS)[0];
  themeColor: string;
  size?: number;
  animating?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const GRID = 9;

  // color map: 0=transparent, 1=body(slate), 2=accent, 3=eyes(white), 4=dark
  const getColors = (tc: string) => [
    "transparent",
    "#94a3b8",
    tc,
    "#ffffff",
    "#1e293b",
  ];

  useEffect(() => {
    if (pet.id === "none" || pet.frames.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = GRID;
    canvas.height = GRID;

    const COLORS = getColors(themeColor);

    function draw(fi: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, GRID, GRID);
      const f = pet.frames[fi % pet.frames.length];
      for (let y = 0; y < GRID; y++) {
        for (let x = 0; x < GRID; x++) {
          const v = f[y]?.[x] ?? 0;
          if (v === 0) continue;
          ctx.fillStyle = COLORS[v] ?? "transparent";
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    draw(0);
    if (!animating) return;
    const speeds = [350, 350, 600]; // frame 2 (blink) shows longer
    let fi = 0;

    const tick = () => {
      fi = (fi + 1) % pet.frames.length;
      draw(fi);
      frameRef.current = fi;
      timerRef.current = setTimeout(tick, speeds[fi] ?? 350) as any;
    };
    const timerRef = { current: null as any };
    timerRef.current = setTimeout(tick, speeds[0]);
    return () => clearTimeout(timerRef.current);
  }, [pet, themeColor, animating]);

  if (pet.id === "none") {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center text-white/20 text-lg"
      >
        ✕
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, imageRendering: "pixelated" }}
    />
  );
}

// ── UsernameWithPet ───────────────────────────────────────────────────────────
// Pet crawls back and forth above the username, with a bounce on direction change

export function UsernameWithPet({
  name,
  petId,
  themeColor,
  petSize = 28,
}: {
  name: string;
  petId: string;
  themeColor: string;
  petSize?: number;
}) {
  const pet = PETS.find((p) => p.id === petId) ?? PETS[PETS.length - 1];
  const [pos, setPos] = useState(0); // 0–100 percent
  const [flip, setFlip] = useState(false);
  const [bounce, setBounce] = useState(0); // vertical offset for bounce
  const dirRef = useRef(1);
  const posRef = useRef(0);

  useEffect(() => {
    if (pet.id === "none") return;

    // movement tick
    const moveId = setInterval(() => {
      posRef.current += dirRef.current * 1.5;
      if (posRef.current >= 100) {
        posRef.current = 100;
        dirRef.current = -1;
        setFlip(true);
        setBounce(-4); // little jump on turn
        setTimeout(() => setBounce(0), 150);
      }
      if (posRef.current <= 0) {
        posRef.current = 0;
        dirRef.current = 1;
        setFlip(false);
        setBounce(-4);
        setTimeout(() => setBounce(0), 150);
      }
      setPos(posRef.current);
    }, 40);

    return () => clearInterval(moveId);
  }, [pet]);

  return (
    <span className="relative inline-flex items-center">
      <span
        style={{ color: themeColor }}
        className="font-bold tracking-tight text-sm"
      >
        {name}
      </span>
      {pet.id !== "none" && (
        <span
          className="absolute pointer-events-none transition-transform"
          style={{
            left: `${pos}%`,
            top: `${-petSize - 2 + bounce}px`,
            transform: `translateX(-50%) scaleX(${flip ? -1 : 1})`,
            filter: `drop-shadow(0 0 4px ${themeColor}80)`,
          }}
        >
          <PetCanvas
            pet={pet}
            themeColor={themeColor}
            size={petSize}
            animating
          />
        </span>
      )}
    </span>
  );
}

// ── Avatar presets ────────────────────────────────────────────────────────────

const AVATAR_PRESETS = [
  "vyns_alpha",
  "vyns_beta",
  "vyns_gamma",
  "vyns_delta",
  "pixel_ghost",
  "pixel_cat",
  "pixel_alien",
  "cyber_punk",
  "neon_drifter",
  "sol_hunter",
  "dark_matter",
  "void_walker",
];

// ── Modal ─────────────────────────────────────────────────────────────────────

interface Props {
  currentName: string;
  initialCustomization: ProfileCustomization;
  onSave: (c: ProfileCustomization) => Promise<void>;
  onClose: () => void;
}

export default function ProfileCustomizeModal({
  currentName,
  initialCustomization,
  onSave,
  onClose,
}: Props) {
  const [tab, setTab] = useState<"theme" | "pet" | "avatar">("theme");
  const [theme, setTheme] = useState(initialCustomization.theme || "teal");
  const [petId, setPetId] = useState(initialCustomization.petId || "none");
  const [avatarSeed, setAvatarSeed] = useState(
    initialCustomization.avatarSeed || currentName,
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const activeTheme = THEMES.find((t) => t.id === theme) ?? THEMES[0];
  const activePet = PETS.find((p) => p.id === petId) ?? PETS[PETS.length - 1];

  async function handleSave() {
    setSaving(true);
    await onSave({ theme, petId, avatarSeed });
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  }

  const TABS = [
    {
      id: "theme" as const,
      label: "Theme",
      icon: <Palette className="w-3.5 h-3.5" />,
    },
    {
      id: "pet" as const,
      label: "Pet",
      icon: <Sparkles className="w-3.5 h-3.5" />,
    },
    {
      id: "avatar" as const,
      label: "Avatar",
      icon: <User className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#0a0f1a] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-white">
              Customize profile
            </p>
            <p className="text-xs text-white/30 mt-0.5">Theme · Pet · Avatar</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/20 hover:text-white/60 transition-colors rounded-lg hover:bg-white/[0.05]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live preview */}
        <div
          className="mx-6 mt-5 mb-4 rounded-2xl p-4 border flex items-center gap-4"
          style={{
            borderColor: `${activeTheme.color}30`,
            background: `linear-gradient(135deg, ${activeTheme.color}08, transparent)`,
          }}
        >
          <div
            className="rounded-xl overflow-hidden shrink-0"
            style={{ boxShadow: `0 0 16px ${activeTheme.glow}` }}
          >
            <PixelAvatar
              seed={avatarSeed}
              size={52}
              themeColor={activeTheme.color}
            />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-[10px] text-white/25 uppercase tracking-widest">
              Preview
            </p>
            {/* Extra top padding so pet has room to show above the name */}
            <div style={{ paddingTop: 36 }}>
              <UsernameWithPet
                name={currentName || "username"}
                petId={petId}
                themeColor={activeTheme.color}
                petSize={28}
              />
            </div>
            <p className="text-[10px] text-white/25 mt-1">
              {activePet.id !== "none" ? `${activePet.label} pet` : "No pet"}
              {" · "}
              <span style={{ color: activeTheme.color }}>
                {activeTheme.label}
              </span>
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mx-6 mb-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 justify-center cursor-pointer ${
                tab === t.id
                  ? "text-white bg-white/[0.08] border border-white/[0.10]"
                  : "text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="px-6 pb-6 space-y-3">
          {/* Theme tab */}
          {tab === "theme" && (
            <div className="space-y-3">
              <p className="text-xs text-white/30">
                Pick a color theme for your username and accent
              </p>
              <div className="grid grid-cols-4 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                      theme === t.id
                        ? "border-white/20 bg-white/[0.06]"
                        : "border-white/[0.05] hover:border-white/[0.10] bg-white/[0.02]"
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg"
                      style={{
                        background: t.color,
                        boxShadow:
                          theme === t.id ? `0 0 12px ${t.glow}` : "none",
                      }}
                    />
                    <span className="text-[10px] text-white/40">{t.label}</span>
                    {theme === t.id && (
                      <div className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full bg-white/20 flex items-center justify-center">
                        <Check className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pet tab */}
          {tab === "pet" && (
            <div className="space-y-3">
              <p className="text-xs text-white/30">
                Choose a pixel pet — it crawls above your username
              </p>
              <div className="grid grid-cols-4 gap-2">
                {PETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPetId(p.id)}
                    className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                      petId === p.id
                        ? "border-white/20 bg-white/[0.06]"
                        : "border-white/[0.05] hover:border-white/[0.10] bg-white/[0.02]"
                    }`}
                  >
                    <div className="w-12 h-12 flex items-center justify-center">
                      {p.id === "none" ? (
                        <span className="text-2xl opacity-30">✕</span>
                      ) : (
                        <PetCanvas
                          pet={p}
                          themeColor={activeTheme.color}
                          size={44}
                          animating={petId === p.id}
                        />
                      )}
                    </div>
                    <span className="text-[10px] text-white/40">{p.label}</span>
                    {petId === p.id && (
                      <div className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full bg-white/20 flex items-center justify-center">
                        <Check className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Avatar tab */}
          {tab === "avatar" && (
            <div className="space-y-3">
              <p className="text-xs text-white/30">
                Pick a pixel avatar or generate from a seed
              </p>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_PRESETS.map((seed) => (
                  <button
                    key={seed}
                    onClick={() => setAvatarSeed(seed)}
                    className={`rounded-xl overflow-hidden transition-all cursor-pointer ${
                      avatarSeed === seed
                        ? "ring-2 ring-white/30 scale-105"
                        : "opacity-60 hover:opacity-100 hover:scale-105"
                    }`}
                    title={seed}
                  >
                    <PixelAvatar
                      seed={seed}
                      size={44}
                      themeColor={activeTheme.color}
                    />
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] text-white/25 uppercase tracking-widest">
                  Custom seed
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={avatarSeed}
                    onChange={(e) => setAvatarSeed(e.target.value)}
                    placeholder="Type anything to generate…"
                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl py-2 px-3 text-sm text-white placeholder-white/15 focus:outline-none focus:border-white/20 transition-all"
                  />
                  <button
                    onClick={() =>
                      setAvatarSeed(Math.random().toString(36).slice(2, 10))
                    }
                    className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/30 hover:text-white/60 hover:border-white/15 transition-all cursor-pointer"
                    title="Random"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-2 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            style={{
              background: `${activeTheme.color}20`,
              border: `1px solid ${activeTheme.color}40`,
              color: activeTheme.color,
            }}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" /> Saved!
              </>
            ) : saving ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />{" "}
                Saving…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Save customization
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
