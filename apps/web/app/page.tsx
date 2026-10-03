"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { api, fallbackBuildings, type Building } from "@/lib/api";

const YabaScene = dynamic(() => import("@/game/world/YabaScene"), { ssr: false });

export default function Home() {
  const [buildings, setBuildings] = useState<Building[]>(fallbackBuildings);
  const [health, setHealth] = useState<string>("checking…");
  const userId = useMemo(() => `web-${Math.floor(Math.random() * 100000)}`, []);

  useEffect(() => {
    api<{ status?: string } | string>("/healthz")
      .then(() => setHealth("online"))
      .catch(() => setHealth("offline (showing local preview)"));
    api<Building[]>("/api/buildings")
      .then(setBuildings)
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-950 text-zinc-50 font-sans">
      <header className="w-full max-w-5xl flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-bold tracking-tight">Wazobia <span className="text-amber-400">· Yaba</span></h1>
        <div className="text-sm text-zinc-400">api: {health} · you: {userId} · WASD to walk</div>
      </header>
      <main className="w-full max-w-5xl px-6 pb-10 flex flex-col gap-4">
        <YabaScene buildings={buildings} userId={userId} />
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-zinc-800 p-4">
            <div className="font-semibold mb-1">MVP 0 — two players see each other</div>
            <p className="text-zinc-400">Open this page in two tabs. Both connect to <code>/ws?zone=zone-b</code>. Movement (10Hz) is relayed by zone only — no Postgres writes per frame.</p>
          </div>
          <div className="rounded-xl border border-zinc-800 p-4">
            <div className="font-semibold mb-1">Buildings ({buildings.length})</div>
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
