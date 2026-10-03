"use client";

export type EntryTab = "home" | "live" | "map" | "phone";

const TABS: { id: EntryTab; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "live", label: "Live" },
  { id: "map", label: "Map" },
  { id: "phone", label: "Phone" },
];

function TabIcon({ tab }: { tab: EntryTab }) {
  const paths: Record<EntryTab, React.ReactNode> = {
    home: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
    live: (
      <>
        <circle cx="12" cy="5" r="2" />
        <path d="m10 22 1-6-3-3 2-5 5 2 2 4-4 1-1 4 3 3M8 11l-4 3M14 10l4-2" />
      </>
    ),
    map: (
      <>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
        <path d="M9 3v15m6-12v15" />
      </>
    ),
    phone: (
      <>
        <rect x="6" y="2" width="12" height="20" rx="2" />
        <path d="M10 18h4" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {paths[tab]}
    </svg>
  );
}

export default function TabBar({ tab, onTab }: { tab: EntryTab; onTab: (t: EntryTab) => void }) {
  return (
    <div className="pointer-events-auto flex items-center gap-1 bg-white/95 rounded-full p-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.12)]">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onTab(t.id)}
          aria-current={tab === t.id ? "page" : undefined}
          className={`flex flex-col items-center gap-0.5 rounded-full px-6 sm:px-8 py-2 text-xs transition-colors ${
            tab === t.id ? "bg-slate-900 text-white font-semibold" : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <TabIcon tab={t.id} />
          {t.label}
        </button>
      ))}
    </div>
  );
}
