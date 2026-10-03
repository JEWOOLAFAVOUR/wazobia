"use client";

import { useState } from "react";

export default function ChatPanel({
  chats,
  onSend,
}: {
  chats: { from: string; scope: string; text: string; at: number }[];
  onSend: (text: string, scope: "zone" | "global") => boolean | void;
}) {
  const [tab, setTab] = useState<"zone" | "global">("zone");
  const [draft, setDraft] = useState("");
  const filtered = chats.filter((c) => c.scope === tab).slice(-30);

  const send = () => {
    if (onSend(draft, tab)) setDraft("");
  };

  return (
    <div className="rounded-xl border border-zinc-800 p-3 text-sm flex flex-col gap-2 bg-black/40">
      <div className="flex gap-2">
        {(["zone", "global"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`rounded-full px-3 py-1 text-xs border ${tab === s ? "bg-amber-400 text-black border-amber-400 font-bold" : "border-zinc-700 text-zinc-300"}`}
          >
            {s === "zone" ? "Yaba / zone" : "Lagos / global"}
          </button>
        ))}
        <span className="ml-auto text-xs text-zinc-500">280 chars · 2 msg/s limit</span>
      </div>
      <div className="h-36 overflow-y-auto flex flex-col gap-1 pr-1">
        {filtered.length === 0 && <div className="text-zinc-600 text-xs">No messages yet. Say hello — open a second tab to see it land.</div>}
        {filtered.map((c, i) => (
          <div key={i} className="text-zinc-200">
            <span className="text-amber-300 font-semibold">{c.from}</span>
            <span className="text-zinc-500"> · </span>
            <span>{c.text}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder={tab === "zone" ? "Message nearby in Yaba…" : "Message all of Lagos…"}
          maxLength={280}
          className="flex-1 rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-amber-400"
        />
        <button onClick={send} className="rounded-lg bg-amber-400 text-black font-bold px-4 py-2 text-sm">Send</button>
      </div>
    </div>
  );
}
