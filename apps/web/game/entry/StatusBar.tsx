"use client";

import type { Clock } from "./useCityStatus";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StatusBar({
  clock,
  mood,
  online,
  balance,
  onAdd,
}: {
  clock: Clock | null;
  mood: string;
  online: number;
  balance: string | null;
  onAdd: () => void;
}) {
  const day = DAYS[(clock?.day ?? 3) % 7];
  const hh = clock?.hour ?? 18;
  const ap = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return (
    <div className="pointer-events-auto flex items-center gap-3 bg-white/95 rounded-full pl-5 pr-2 py-2 shadow-[0_8px_30px_rgba(15,23,42,0.12)] text-sm text-slate-800">
      <span className="font-semibold whitespace-nowrap">
        🌙 {day} {clock?.day ?? "–"} · {h12}:{clock ? "00" : "--"} {ap}
      </span>
      <span className="text-slate-300">|</span>
      <span className="whitespace-nowrap">🙂 {mood}</span>
      <span className="text-slate-300">|</span>
      <span className="text-emerald-600 font-semibold whitespace-nowrap">● {online} online</span>
      <span className="flex-1" />
      <span className="font-bold whitespace-nowrap">{balance ?? "₦—"}</span>
      <button
        onClick={onAdd}
        aria-label="Add money"
        className="w-9 h-9 rounded-full bg-emerald-500 text-white text-xl font-bold hover:bg-emerald-600"
      >
        +
      </button>
    </div>
  );
}
