"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { api, fallbackBuildings, type Building } from "@/lib/api";
import type { Proximity } from "@/game/world/YabaScene";
import { useSocket } from "@/game/networking/useSocket";
import ChatPanel from "@/components/ChatPanel";
import PresenceList from "@/components/PresenceList";

const YabaScene = dynamic(() => import("@/game/world/YabaScene"), { ssr: false });

export default function Home() {
  const [buildings, setBuildings] = useState<Building[]>(fallbackBuildings);
  const [health, setHealth] = useState<string>("checking…");
  const [near, setNear] = useState<Proximity>(null);
  const [count, setCount] = useState(1);
  const userId = useMemo(() => `web-${Math.floor(Math.random() * 100000)}`, []);
  const posRef = useRef({ x: 0, z: 12 });
  const socket = useSocket(userId, "zone-b", posRef);

  useEffect(() => {
    api("/healthz")
      .then(() => setHealth("online"))
      .catch(() => setHealth("offline (local preview)"));
    api<Building[]>("/api/buildings")
      .then(setBuildings)
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-950 text-zinc-50 font-sans">
      <header className="w-full max-w-5xl flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-bold tracking-tight">Wazobia <span className="text-amber-400">· Yaba</span></h1>
        <div className="text-sm text-zinc-400">api: {health} · you: {userId} · {count} here</div>
      </header>
      <main className="w-full max-w-5xl px-6 pb-10 flex flex-col gap-4">
        <YabaScene buildings={buildings} posRef={posRef} socket={socket} onProximity={setNear} onCount={setCount} />
        {socket.notices.slice(-3).map((n, i) => (
          <div key={i} className="text-xs text-zinc-500">
            {n.kind === "join" ? "→" : "←"} {n.userId} {n.kind === "join" ? "entered" : "left"} zone-b
          </div>
        ))}
        {near ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            Near <b>{near.name}</b> <span className="text-zinc-400">({near.kind}, {near.d.toFixed(1)}m)</span> — entering interiors lands in Phase 4 (economy). Chat below is live now.
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 p-3 text-sm text-zinc-400">
            Walk with <b className="text-zinc-200">WASD / arrows</b>, hold <b className="text-zinc-200">Shift</b> to run. Server clamps speed + bounds; no per-frame Postgres writes.
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          <ChatPanel chats={socket.chats} onSend={socket.sendChat} />
          <PresenceList zone="zone-b" />
        </div>
        <div className="rounded-xl border border-zinc-800 p-4 text-sm">
          <div className="font-semibold mb-1">Phase 3 — multiplayer</div>
          <p className="text-zinc-400">WS: move (10Hz, validated) + chat (zone/global, 280 chars, 500ms limit) + join/leave. Interest: zone-only for moves; global reaches all zones. Presence: Redis TTL, <code>/api/presence?zone=zone-b</code> polls every 5s.</p>
        </div>
      </main>
    </div>
  );
}
