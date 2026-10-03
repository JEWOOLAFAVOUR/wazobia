"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { api, fallbackBuildings, type Building } from "@/lib/api";
import type { Proximity } from "@/game/world/YabaScene";
import { useSocket } from "@/game/networking/useSocket";
import { SPAWN } from "@/game/player/Player";
import ChatPanel from "@/components/ChatPanel";
import PresenceList from "@/components/PresenceList";
import AuthBox from "@/components/AuthBox";
import ShopPanel from "@/components/ShopPanel";
import LifePanel from "@/components/LifePanel";
import BusinessPanel from "@/components/BusinessPanel";
import SocialPanel from "@/components/SocialPanel";

const YabaScene = dynamic(() => import("@/game/world/YabaScene"), { ssr: false });

const SHOP_KINDS = new Set(["restaurant", "shop"]);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{title}</h2>
      {children}
    </section>
  );
}

export default function Home() {
  const [buildings, setBuildings] = useState<Building[]>(fallbackBuildings);
  const [health, setHealth] = useState<string>("checking…");
  const [near, setNear] = useState<Proximity>(null);
  const [count, setCount] = useState(1);
  const [walletKey, setWalletKey] = useState(0);
  const reactId = useId();
  const userId = useMemo(() => `web-${reactId.replace(/[^a-zA-Z0-9]/g, "")}`, [reactId]);
  const posRef = useRef({ ...SPAWN });
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
  const bump = () => setWalletKey((k) => k + 1);

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-950 text-zinc-50 font-sans">
      <header className="w-full max-w-5xl flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight">Wazobia <span className="text-amber-400">· Yaba</span></h1>
        <div className="text-xs text-zinc-500">api: {health} · {count} here</div>
      </header>

      <main className="w-full max-w-5xl px-6 pb-12 flex flex-col gap-8">
        <YabaScene buildings={buildings} posRef={posRef} socket={socket} onProximity={setNear} onCount={setCount} />

        {socket.notices.slice(-3).map((n, i) => (
          <div key={i} className="text-xs text-zinc-600 -mt-6">
            {n.kind === "join" ? "→" : "←"} {n.userId} {n.kind === "join" ? "entered" : "left"} zone-b
          </div>
        ))}

        <div className="rounded-xl border border-zinc-800/80 px-4 py-3 text-sm text-zinc-400 flex items-center gap-3 flex-wrap">
          <span>New here?</span>
          <Link href="/create" className="rounded-full bg-stone-100 text-stone-900 font-semibold px-4 py-1.5 text-xs hover:bg-white transition-colors">
            Create Your Character
          </Link>
          <span className="text-xs text-zinc-600">Walk with WASD, hold Shift to run.</span>
        </div>

        <ShopPanel shopId={shopId} walletKey={walletKey} onPurchased={bump} />
        {!shopId && near && (
          <div className="rounded-xl border border-zinc-800/80 px-4 py-3 text-sm text-zinc-400">
            Near <span className="text-zinc-200">{near.name}</span> <span className="text-zinc-600">({near.kind})</span> — shops open a buy menu.
          </div>
        )}

        <Section title="Live">
          <div className="grid sm:grid-cols-2 gap-3">
            <ChatPanel chats={socket.chats} onSend={socket.sendChat} />
            <div className="flex flex-col gap-3">
              <AuthBox onAuth={bump} />
              <PresenceList zone="zone-b" />
            </div>
          </div>
        </Section>

        <Section title="Daily life">
          <LifePanel refreshKey={walletKey} onMoney={bump} />
        </Section>

        <Section title="Business">
          <BusinessPanel refreshKey={walletKey} onMoney={bump} />
        </Section>

        <Section title="Community">
          <SocialPanel refreshKey={walletKey} onMoney={bump} />
        </Section>
      </main>
    </div>
  );
}
