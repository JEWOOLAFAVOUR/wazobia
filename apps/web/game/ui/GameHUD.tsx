"use client";

import type { Interactable } from "@/game/world/YabaBlock";

export default function GameHUD({
  name,
  near,
  toast,
  showHint,
}: {
  name: string;
  near: Interactable | null;
  toast: string | null;
  showHint: boolean;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 sm:p-6">
      <div className="flex justify-center">
        <div className="rounded-full bg-black/45 backdrop-blur px-4 py-1 text-sm text-stone-200 border border-white/10">
          ₦12,500
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        {showHint && !near && (
          <div className="rounded-full bg-black/50 px-4 py-1.5 text-xs text-stone-300 border border-white/10">
            WASD to move · drag to look · Shift to run
          </div>
        )}
        {near && (
          <div className="pointer-events-auto flex flex-col items-center gap-1.5">
            <div className="rounded-xl bg-black/60 backdrop-blur px-4 py-2 text-center border border-white/10">
              <div className="text-sm font-semibold text-stone-100">{near.title}</div>
              <div className="text-[11px] text-stone-400">{near.detail}</div>
            </div>
            <div className="rounded-full bg-amber-400 text-black text-xs font-bold px-4 py-1.5">
              E&nbsp;&nbsp;Interact
            </div>
          </div>
        )}
        {toast && (
          <div className="rounded-full bg-black/60 px-4 py-1.5 text-xs text-amber-200 border border-amber-400/20">
            {toast}
          </div>
        )}
        {name ? <div className="text-[11px] text-stone-500">{name} · Yaba</div> : null}
      </div>
    </div>
  );
}
