"use client";

import { useEffect, useState } from "react";
import { api, formatNaira } from "@/lib/api";

type Evt = { id: string; title: string; venue: string; startsAt: string; capacity: number; ticketKobo: number; going: number };
type Chat = { from: string; scope: string; text: string; at: number };

export default function PhoneSheet({
  chats,
  onSend,
  onToast,
}: {
  chats: Chat[];
  onSend: (text: string) => void;
  onToast: (m: string | null) => void;
}) {
  const [events, setEvents] = useState<Evt[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    api<Evt[]>("/api/events").then((e) => setEvents(e.slice(0, 5))).catch(() => {});
  }, []);

  const attend = async (id: string, title: string) => {
    try {
      await api(`/api/events/${id}/attend`, { method: "POST", body: JSON.stringify({}) });
      onToast(`You're going to ${title}.`);
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      if (m.includes("401")) onToast("Log in on the main page first.");
      else if (m.includes("402")) onToast("Not enough cash for the ticket.");
      else if (m.includes("409")) onToast("That event is full.");
      else onToast("Could not join.");
    }
  };

  const send = () => {
    const clean = draft.trim().slice(0, 280);
    if (!clean) return;
    onSend(clean);
    setDraft("");
  };

  return (
    <div className="pointer-events-auto bg-white/95 rounded-3xl shadow-xl p-4 max-h-[46vh] overflow-y-auto w-full max-w-md flex flex-col gap-3">
      <div>
        <div className="text-sm font-bold text-slate-800 mb-2">Street chat</div>
        <div className="h-28 overflow-y-auto flex flex-col gap-1 mb-2">
          {chats.length === 0 && <div className="text-xs text-slate-400">Quiet for now — say hello to Yaba.</div>}
          {chats.slice(-20).map((c, i) => (
            <div key={i} className="text-xs text-slate-600">
              <b className="text-slate-800">{c.from}</b> {c.text}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") send();
            }}
            onKeyUp={(e) => e.stopPropagation()}
            placeholder="Say something out loud…"
            maxLength={280}
            className="flex-1 rounded-full bg-slate-100 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <button onClick={send} className="rounded-full bg-emerald-500 text-white font-bold px-4 text-sm">
            ➤
          </button>
        </div>
      </div>
      <div>
        <div className="text-sm font-bold text-slate-800 mb-2">Happening soon</div>
        {events.length === 0 && <div className="text-xs text-slate-400">Nothing upcoming — check back.</div>}
        {events.map((e) => (
          <div key={e.id} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-xl px-3 py-2 mb-1">
            <span>
              <b>{e.title}</b> · {e.venue} · {e.going}/{e.capacity} · {e.ticketKobo === 0 ? "free" : formatNaira(e.ticketKobo)}
            </span>
            <button onClick={() => attend(e.id, e.title)} className="ml-auto rounded-full bg-slate-900 text-white font-bold px-3 py-1">
              Go
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
