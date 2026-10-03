"use client";

import { SKIN_TONES } from "@/game/character/appearance";

export default function NeedsCard({ name, energy, mood, skinId }: { name: string; energy: number | null; mood: string; skinId: string }) {
  const skin = SKIN_TONES.find((t) => t.id === skinId)?.swatch ?? "#7c4a2b";
  const pct = energy == null ? 0 : Math.max(0, Math.min(100, energy));
  const bar = (v: number, c: string) => (
    <div className="h-1.5 w-16 rounded-full bg-slate-200 overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${v}%`, backgroundColor: c }} />
    </div>
  );
  return (
    <div className="pointer-events-none flex items-center gap-2">
      <div className="w-11 h-11 rounded-full bg-white shadow p-0.5">
        <div className="w-full h-full rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ backgroundColor: skin }}>
          {(name || "Y").slice(0, 1).toUpperCase()}
        </div>
      </div>
      <div className="bg-white/95 rounded-2xl shadow px-3 py-2 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[11px]">
          <span>🍲</span>
          {bar(pct, "#22c55e")}
          <span>⚡</span>
          {bar(pct, "#f59e0b")}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span>
            💬 {mood} · 🍳 {energy == null ? "—" : energy}
          </span>
        </div>
      </div>
    </div>
  );
}
