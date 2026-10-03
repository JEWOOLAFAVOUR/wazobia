"use client";

export type EntryTab = "home" | "live" | "map" | "phone";

const TABS: { id: EntryTab; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "⌂" },
  { id: "live", label: "Live", icon: "🚶" },
  { id: "map", label: "Map", icon: "🗺" },
  { id: "phone", label: "Phone", icon: "📱" },
];

export default function TabBar({ tab, onTab }: { tab: EntryTab; onTab: (t: EntryTab) => void }) {
  return (
    <div className="pointer-events-auto flex items-center gap-1 bg-white/95 rounded-full p-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.12)]">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onTab(t.id)}
          className={`flex flex-col items-center gap-0.5 rounded-full px-6 sm:px-8 py-2 text-xs transition-colors ${
            tab === t.id ? "bg-slate-900 text-white font-semibold" : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <span className="text-base leading-none">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}
