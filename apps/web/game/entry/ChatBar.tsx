"use client";

import { useState } from "react";

export default function ChatBar({ onSend }: { onSend: (text: string) => void }) {
  const [draft, setDraft] = useState("");
  const send = () => {
    const clean = draft.trim().slice(0, 280);
    if (!clean) return;
    onSend(clean);
    setDraft("");
  };
  return (
    <div className="pointer-events-auto bg-white/95 rounded-full shadow flex items-center gap-2 pl-5 pr-1.5 py-1.5">
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") send();
        }}
        placeholder="Say something out loud…"
        maxLength={280}
        className="flex-1 min-w-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
      />
      <button
        onClick={send}
        aria-label="Send"
        className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 font-bold hover:bg-emerald-200"
      >
        ➤
      </button>
    </div>
  );
}
