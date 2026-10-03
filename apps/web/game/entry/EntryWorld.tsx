"use client";

import { Suspense, useEffect, useId, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { loadAvatar } from "@/game/entry/avatarStore";
import { useSocket } from "@/game/networking/useSocket";
import { useCityStatus } from "@/game/entry/useCityStatus";
import StatusBar from "@/game/entry/StatusBar";
import TabBar, { type EntryTab } from "@/game/entry/TabBar";
import NeedsCard from "@/game/entry/NeedsCard";
import ChatBar from "@/game/entry/ChatBar";
import VenueLabels from "@/game/entry/VenueLabels";
import BuySheet from "@/game/entry/BuySheet";
import PhoneSheet from "@/game/entry/PhoneSheet";
import HomeWorld from "@/game/entry/HomeWorld";
import YabaHood, { HOOD, plotAtPoint } from "@/game/world/yaba/Hood";
import { SPAWN } from "@/game/world/yaba/layout";
import EntryPlayer, { type EntryPos } from "@/game/player/EntryPlayer";
import EntryCamera from "@/game/camera/EntryCamera";
import EntryTransition from "@/game/ui/EntryTransition";
import type { Interactable } from "@/game/world/YabaBlock";

type Phase = "fade" | "title" | "world";

function World() {
  const avatar = useMemo(() => loadAvatar(), []);
  const [tab, setTab] = useState<EntryTab>("map");
  const [clean, setClean] = useState(false);
  const reactId = useId();
  const userId = useMemo(() => `entry-${reactId.replace(/[^a-zA-Z0-9]/g, "")}`, [reactId]);

  const streetPos = useRef<EntryPos>({ x: SPAWN.x, z: SPAWN.z, heading: SPAWN.facing });
  const [phase, setPhase] = useState<Phase>("fade");
  const [near, setNear] = useState<Interactable | null>(null);
  const [insideId, setInsideId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const bump = () => setTick((t) => t + 1);

  // Street chat socket (zone scope).
  const chatPos = useRef({ x: SPAWN.x, z: SPAWN.z });
  const socket = useSocket(userId, "yaba", chatPos);

  // Toast helper with auto-clear.
  const say = (msg: string | null, ms = 3200) => {
    setToast(msg);
    if (msg) window.setTimeout(() => setToast(null), ms);
  };

  const { clock, status, online, formatBalance } = useCityStatus(true, tick);

  // Intentional beat: black -> YABA/LAGOS -> world fades in.
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("title"), 350);
    const t2 = setTimeout(() => setPhase("world"), 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const checkNear = (x: number, z: number) => {
    chatPos.current.x = x;
    chatPos.current.z = z;
    let best: Interactable | null = null;
    let bd = Infinity;
    for (const it of HOOD.spots) {
      const d = Math.hypot(x - it.x, z - it.z);
      if (d <= it.radius && d < bd) {
        bd = d;
        best = it;
      }
    }
    setNear((prev) => (prev?.id === best?.id ? prev : best));
    const inside = plotAtPoint(x, z);
    setInsideId((prev) => {
      const id = inside ? inside.id : null;
      if (prev !== id && id) say(`Welcome to ${inside?.name}.`, 2600);
      return prev === id ? prev : id;
    });
  };

  const nearRef = useRef<Interactable | null>(null);
  useEffect(() => {
    nearRef.current = near;
  }, [near]);
  const interact = () => {
    const n = nearRef.current;
    if (!n) return;
    say(`${n.title} — ${n.detail}`);
  };

  const mood = status == null ? "New here" : status.energy >= 60 ? "Fine" : status.energy >= 30 ? "Tired" : "Drained";
  const showMap = tab === "map" || tab === "buy" || tab === "phone";
  useEffect(() => {
    console.log(`[probe] shell mounted tab=${tab} clean=${clean}`);
  }, [tab, clean]);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#9fc3d8] font-sans">
      {showMap && (
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 8, 18], fov: 50 }}>
          <color attach="background" args={["#f0c795"]} />
          <ambientLight intensity={0.55} />
          <hemisphereLight args={["#ffe3b3", "#2a3327", 0.5]} />
          <directionalLight position={[18, 26, 10]} intensity={1.9} color="#ffd9a0" castShadow shadow-mapSize={[2048, 2048]} />
          <directionalLight position={[-14, 10, -12]} intensity={0.35} color="#9db8ff" />
          <fog attach="fog" args={["#d8b98a", 55, 110]} />
          <Suspense fallback={null}>
            <YabaHood insideId={insideId} />
            <VenueLabels />
            <EntryPlayer
              avatar={avatar}
              initial={{ x: SPAWN.x, z: SPAWN.z, heading: SPAWN.facing }}
              posRef={streetPos}
              colliders={HOOD.colliders}
              onMove={checkNear}
              onInteractKey={interact}
            />
          </Suspense>
          <EntryCamera posRef={streetPos} />
        </Canvas>
      )}
      {tab === "home" && <HomeWorld avatar={avatar} onToast={say} refreshStatus={bump} />}

      {!clean && (
        <>
          {/* top status */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[min(94vw,640px)] pointer-events-none">
            <StatusBar
              clock={clock}
              mood={mood}
              online={online}
              balance={formatBalance}
              onAdd={() => setTab("buy")}
            />
          </div>

          {/* contextual hint */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none">
            {tab === "map" && !near && (
              <div className="bg-white/90 rounded-full px-4 py-1.5 text-xs text-slate-600 shadow">Walk to a glowing doorway to step inside · WASD</div>
            )}
            {tab === "map" && near && (
              <div className="bg-white/95 rounded-full px-4 py-1.5 text-xs text-slate-700 shadow">
                <b>{near.title}</b> · press <b>E</b>
              </div>
            )}
            {tab === "home" && (
              <div className="bg-white/90 rounded-full px-4 py-1.5 text-xs text-slate-600 shadow">Eat something — walk to the counter, tap E</div>
            )}
          </div>

          {/* needs */}
          <div className="absolute left-3 bottom-24 pointer-events-none">
            <NeedsCard name={avatar.name} energy={status?.energy ?? null} mood={mood} skinId={avatar.skin} />
          </div>
          <button
            onClick={() => setClean(true)}
            className="absolute left-3 bottom-[4.5rem] bg-white/90 rounded-full px-3 py-1 text-[11px] text-slate-500 shadow"
          >
            ⌃ Clean screen
          </button>

          {/* chat + sheets + tabs */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-[min(94vw,560px)] pointer-events-none">
            {(tab === "map" || tab === "home") && <ChatBar onSend={(t) => socket.sendChat(t, "zone")} />}
            {tab === "buy" && <BuySheet onToast={say} refreshStatus={bump} />}
            {tab === "phone" && <PhoneSheet chats={socket.chats} onSend={(t) => socket.sendChat(t, "zone")} onToast={say} />}
            {toast && <div className="bg-slate-900/90 text-white text-xs rounded-full px-4 py-2 shadow">{toast}</div>}
            <TabBar tab={tab} onTab={setTab} />
          </div>
        </>
      )}
      {clean && (
        <button
          onClick={() => setClean(false)}
          className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-white/90 shadow text-lg"
          aria-label="Show interface"
        >
          ⌨
        </button>
      )}
      <EntryTransition phase={phase} />
    </div>
  );
}

export default dynamic(() => Promise.resolve(World), { ssr: false });
