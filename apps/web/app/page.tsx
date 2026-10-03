"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { api, fallbackBuildings, type Building } from "@/lib/api";
import type { Proximity } from "@/game/world/YabaScene";

const YabaScene = dynamic(() => import("@/game/world/YabaScene"), { ssr: false });

export default function Home() {
  const [buildings, setBuildings] = useState<Building[]>(fallbackBuildings);
  const [health, setHealth] = useState<string>("checking…");
  const [near, setNear] = useState<Proximity>(null);
  const [count, setCount] = useState(1);
  const userId = useMemo(() => `web-${Math.floor(Math.random() * 100000)}`, []);

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
        <YabaScene buildings={buildings} userId={userId} onProximity={setNear} onCount={setCount} />
        {near ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            Near <b>{near.name}</b> <span className="text-zinc-400">({near.kind}, {near.d.toFixed(1)}m)</span> — entering interiors lands in Phase 4 (economy). Movement + collision are live now.
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 p-3 text-sm text-zinc-400">
            Walk with <b className="text-zinc-200">WASD / arrows</b>, hold <b className="text-zinc-200">Shift</b> to run. Walk up to a building to see its prompt. Server clamps speed + bounds; no per-frame Postgres writes.
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-zinc-800 p-4">
            <div className="font-semibold mb-1">Phase 2 — 3D world</div>
            <p className="text-zinc-400">Follow-cam by default, orbit on toggle. AABB collision vs buildings, world bound ±55, remote players interpolated with name tags. Open two tabs → same zone-b → you see each other.</p>
          </div>
          <div className="rounded-xl border border-zinc-800 p-4">
            <div className="font-semibold mb-1">Yaba ({buildings.length})</div>
            <ul className="text-zinc-400">
              {buildings.map((b) => (
                <li key={b.id}>· {b.name} <span className="text-zinc-600">({b.kind}, {b.zone})</span></li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
