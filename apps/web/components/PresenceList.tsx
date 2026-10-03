"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Presence = { userId: string; zone: string; status: string };

export default function PresenceList({ zone }: { zone: string }) {
  const [list, setList] = useState<Presence[]>([]);
  useEffect(() => {
    let alive = true;
    const poll = () => {
      api<Presence[]>(`/api/presence?zone=${encodeURIComponent(zone)}`)
        .then((d) => { if (alive) setList(d); })
        .catch(() => {});
    };
    poll();
    const t = setInterval(poll, 5000);
    return () => { alive = false; clearInterval(t); };
  }, [zone]);
  return (
    <div className="rounded-xl border border-zinc-800 p-3 text-sm bg-black/40">
      <div className="font-semibold mb-1">Here in {zone} ({list.length})</div>
      {list.length === 0 ? (
        <div className="text-zinc-500 text-xs">Just you (or API offline — live count still shows in-scene).</div>
      ) : (
        <div className="flex flex-wrap gap-1">
          {list.slice(0, 20).map((p) => (
            <span key={p.userId} className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-200">{p.userId}</span>
          ))}
        </div>
      )}
    </div>
  );
}
