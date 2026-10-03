"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { api, fallbackBuildings, type Building } from "@/lib/api";
import type { Proximity } from "@/game/world/YabaScene";
import { useSocket } from "@/game/networking/useSocket";
import ChatPanel from "@/components/ChatPanel";
import PresenceList from "@/components/PresenceList";
import AuthBox from "@/components/AuthBox";
import ShopPanel from "@/components/ShopPanel";

const YabaScene = dynamic(() => import("@/game/world/YabaScene"), { ssr: false });

const SHOP_KINDS = new Set(["restaurant", "shop"]);

export default function Home() {
  const [buildings, setBuildings] = useState<Building[]>(fallbackBuildings);
  const [health, setHealth] = useState<string>("checking…");
  const [near, setNear] = useState<Proximity>(null);
  const [count, setCount] = useState(1);
  const [walletKey, setWalletKey] = useState(0);
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

  const shopId = near && SHOP_KINDS.has(near.kind) ? near.id : null;

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
        <ShopPanel shopId={shopId} walletKey={walletKey} onPurchased={() => setWalletKey((k) => k + 1)} />
        {!shopId && (
          near ? (
            <div className="rounded-xl border border-zinc-800 p-3 text-sm text-zinc-400">
              Near <b className="text-zinc-200">{near.name}</b> ({near.kind}) — shops open a buy menu; other buildings land in later phases.
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 p-3 text-sm text-zinc-400">
              Walk with <b className="text-zinc-200">WASD / arrows</b>, hold <b className="text-zinc-200">Shift</b> to run. Walk to <b className="text-zinc-200">Mama Put Spot</b> or <b className="text-zinc-200">Corner Shop</b> to buy — money moves via atomic ledger.
            </div>
          )
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          <ChatPanel chats={socket.chats} onSend={socket.sendChat} />
          <div className="flex flex-col gap-3">
            <AuthBox onAuth={() => setWalletKey((k) => k + 1)} />
            <PresenceList zone="zone-b" />
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 p-4 text-sm">
          <div className="font-semibold mb-1">Phase 4 — economy</div>
          <p className="text-zinc-400">Register → ₦50,000 starter → walk to a shop → Buy. Server runs one Postgres TX per purchase (lock player + stock, ledger debit/credit, idempotency key). <code>POST /api/purchases</code> · <code>GET /api/wallet</code> · <code>GET /api/shops</code>.</p>
        </div>
      </main>
    </div>
  );
}
