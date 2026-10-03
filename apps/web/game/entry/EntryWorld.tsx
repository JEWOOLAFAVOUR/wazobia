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
import { PLOTS, SPAWN } from "@/game/world/yaba/layout";
import { streetOccluders } from "@/game/world/yaba/occluders";
import { HOME_SPAWN, LOCATIONS, navigateToLocation, type WorldLocation } from "@/game/navigation/locations";
import EntryPlayer, { type EntryPos } from "@/game/player/EntryPlayer";
import EntryCamera from "@/game/camera/EntryCamera";
import { CITY_CENTER, LagosMapBlocks, MapCamera, type MapFocus } from "@/game/entry/LagosMap";
import AmbientLife from "@/game/world/yaba/AmbientLife";
import type { Interactable } from "@/game/world/YabaBlock";

const FILTERS = ["● Serious go-slow", "📢 Billboards", "🏘 Neighbours", "🌊 Sea", "🏛 Gov"];

function pressKey(key: string, down: boolean) {
  window.dispatchEvent(new KeyboardEvent(down ? "keydown" : "keyup", { key }));
}

function TouchPad() {
  const btn =
    "pointer-events-auto w-11 h-11 rounded-full bg-white/90 shadow text-lg font-bold text-slate-700 active:bg-slate-900 active:text-white touch-none select-none";
  const hold = (key: string) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      pressKey(key, true);
    },
    onPointerUp: () => pressKey(key, false),
    onPointerCancel: () => pressKey(key, false),
    onPointerLeave: () => pressKey(key, false),
  });
  return (
    <div className="absolute right-3 bottom-28 flex flex-col items-center gap-1.5">
      <button className={btn} aria-label="Forward" {...hold("w")}>
        ▲
      </button>
      <div className="flex gap-1.5">
        <button className={btn} aria-label="Left" {...hold("a")}>
          ◀
        </button>
        <button
          className="pointer-events-auto w-11 h-11 rounded-full bg-slate-900 shadow text-sm font-bold text-white touch-none select-none"
          aria-label="Interact"
          onPointerDown={(e) => {
            e.preventDefault();
            pressKey("e", true);
            window.setTimeout(() => pressKey("e", false), 60);
          }}
        >
          E
        </button>
        <button className={btn} aria-label="Right" {...hold("d")}>
          ▶
        </button>
      </div>
      <button className={btn} aria-label="Back" {...hold("s")}>
        ▼
      </button>
    </div>
  );
}

function World() {
  const avatar = useMemo(() => loadAvatar(), []);
  const [tab, setTab] = useState<EntryTab>("map");
  const [clean, setClean] = useState(false);
  const reactId = useId();
  const userId = useMemo(() => `entry-${reactId.replace(/[^a-zA-Z0-9]/g, "")}`, [reactId]);

  const streetPos = useRef<EntryPos>({ x: SPAWN.x, z: SPAWN.z, heading: SPAWN.facing });
  const [streetSpawn, setStreetSpawn] = useState<EntryPos>({ x: SPAWN.x, z: SPAWN.z, heading: SPAWN.facing });
  const [homeSpawn, setHomeSpawn] = useState<EntryPos>({ ...HOME_SPAWN });
  const [showPlaces, setShowPlaces] = useState(false);
  const occluders = useMemo(() => streetOccluders(), []);
  const mapFocus = useRef<MapFocus>({ ...CITY_CENTER });
  const [near, setNear] = useState<Interactable | null>(null);
  const [insideId, setInsideId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const bump = () => setTick((t) => t + 1);

  // Street chat socket (zone scope). Connect lazily only in Live so Map stays cursor-clean offline.
  const chatPos = useRef({ x: SPAWN.x, z: SPAWN.z });
  const socket = useSocket(userId, "yaba", chatPos);

  // Toast helper with auto-clear.
  const say = (msg: string | null, ms = 3200) => {
    setToast(msg);
    if (msg) window.setTimeout(() => setToast(null), ms);
  };

  const { clock, status, online, formatBalance } = useCityStatus(true, tick);

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

  const pickVenue = (plotId: string) => {
    const p = PLOTS.find((x) => x.id === plotId);
    if (p) mapFocus.current = { x: p.x, z: p.z };
    setPickedId(plotId);
    say(`${p?.name ?? plotId} — tap Walk street to go there.`);
  };

  /** Single teleport path: every Home/map button funnels through here. */
  const goToLocation = (loc: WorldLocation) => {
    if (loc.areaId === "home-interior") {
      setHomeSpawn({ x: loc.x, z: loc.z, heading: loc.heading });
      setTab("home");
    } else {
      const next = { x: loc.x, z: loc.z, heading: loc.heading };
      streetPos.current = next;
      setStreetSpawn(next);
      setTab("live");
    }
    setShowPlaces(false);
    say(`Arrived at ${loc.label} — walk normally.`);
  };

  const walkTo = (plotId: string) => {
    const loc = navigateToLocation(plotId);
    if (loc) {
      if (loc.areaId === "yaba-street") mapFocus.current = { x: loc.x, z: loc.z };
      goToLocation(loc);
      return;
    }
    setTab("live");
  };

  const mood = status == null ? "New here" : status.energy >= 60 ? "Fine" : status.energy >= 30 ? "Tired" : "Drained";
  const showStreet = tab === "live";
  const showMap = tab === "map";
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#6fb3d2] font-sans">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [395, 390, 374], fov: 32, far: 4000 }}
        frameloop={showMap ? "always" : "never"}
        style={{
          position: "absolute",
          inset: 0,
          cursor: "grab",
          touchAction: "none",
          visibility: showMap ? "visible" : "hidden",
          pointerEvents: showMap ? "auto" : "none",
        }}
        onPointerMissed={() => {
          document.body.style.cursor = "";
        }}
      >
        <color attach="background" args={["#6fb3d2"]} />
        <ambientLight intensity={0.9} />
        <hemisphereLight args={["#e8f4ff", "#4a5a48", 0.6]} />
        <directionalLight position={[24, 30, 12]} intensity={1.4} color="#fff2d9" />
        <Suspense fallback={null}>
          <LagosMapBlocks onPick={pickVenue} />
          <AmbientLife player={streetPos} mapView />
        </Suspense>
        <MapCamera focusRef={mapFocus} />
      </Canvas>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 8, 18], fov: 50 }}
        frameloop={showStreet ? "always" : "never"}
        style={{
          position: "absolute",
          inset: 0,
          touchAction: "none",
          visibility: showStreet ? "visible" : "hidden",
          pointerEvents: showStreet ? "auto" : "none",
        }}
      >
        <color attach="background" args={["#f0c795"]} />
        <ambientLight intensity={0.55} />
        <hemisphereLight args={["#ffe3b3", "#2a3327", 0.5]} />
        <directionalLight position={[18, 26, 10]} intensity={1.9} color="#ffd9a0" castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-14, 10, -12]} intensity={0.35} color="#9db8ff" />
        <fog attach="fog" args={["#d8b98a", 55, 110]} />
        <Suspense fallback={null}>
          <YabaHood insideId={insideId} />
          <VenueLabels />
          <EntryPlayer
            key={`${streetSpawn.x}:${streetSpawn.z}`}
            avatar={avatar}
            initial={streetSpawn}
            posRef={streetPos}
            colliders={HOOD.colliders}
            onMove={checkNear}
            onInteractKey={interact}
          />
          <AmbientLife player={streetPos} />
        </Suspense>
        <EntryCamera posRef={streetPos} occluders={occluders} />
      </Canvas>
      {tab === "home" && (
        <HomeWorld
          avatar={avatar}
          onToast={say}
          refreshStatus={bump}
          spawn={homeSpawn}
          onExit={() => {
            const loc = navigateToLocation("apt-1");
            if (loc) goToLocation(loc);
          }}
        />
      )}

      {!clean && (
        <>
          {/* top status */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[min(94vw,640px)] pointer-events-none">
            <StatusBar
              clock={clock}
              mood={mood}
              online={online}
              balance={formatBalance}
              onAdd={() => say("Top-up arrives with the banking slice — buy on the street for now.")}
            />
          </div>

          {/* map-first overlay: filters + venue chips (HTML, cheap — no drei Html per venue) */}
          {showMap && (
            <div className="absolute top-[4.4rem] left-1/2 -translate-x-1/2 w-[min(96vw,900px)] flex flex-col items-center gap-2 pointer-events-none">
              <div className="pointer-events-auto flex gap-1.5 overflow-x-auto max-w-full bg-white/85 backdrop-blur rounded-full px-2 py-1.5 shadow">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => say(`${f} layer — coming with city simulation.`)}
                    className="whitespace-nowrap text-xs font-semibold text-slate-700 bg-white rounded-full px-3 py-1.5 shadow-sm hover:bg-slate-900 hover:text-white"
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="pointer-events-auto flex gap-1.5 overflow-x-auto max-w-full px-1 py-0.5">
                {PLOTS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => pickVenue(p.id)}
                    onDoubleClick={() => walkTo(p.id)}
                    title="Click to focus · double-click to walk"
                    className="whitespace-nowrap text-xs font-semibold text-slate-800 bg-white/95 rounded-full px-3 py-1.5 shadow hover:bg-slate-900 hover:text-white"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* contextual hint */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none">
            {showMap && (
              <div className="bg-slate-900/85 text-white rounded-full px-4 py-1.5 text-xs shadow">
                Drag to pan · scroll to zoom · click a block · double-click to walk there
              </div>
            )}
            {showStreet && !near && (
              <div className="bg-white/90 rounded-full px-4 py-1.5 text-xs text-slate-600 shadow">Walk to a glowing doorway to step inside · WASD / joystick</div>
            )}
            {showStreet && near && (
              <div className="bg-white/95 rounded-full px-4 py-1.5 text-xs text-slate-700 shadow">
                <b>{near.title}</b> · press <b>E</b>
              </div>
            )}
            {tab === "home" && (
              <div className="bg-white/90 rounded-full px-4 py-1.5 text-xs text-slate-600 shadow">Tap the floor to walk there · 📍 Go somewhere to travel</div>
            )}
          </div>

          {/* Home places menu — every destination resolves via navigateToLocation */}
          {tab === "home" && (
            <div className="absolute right-3 top-24 w-[min(70vw,260px)] flex flex-col items-end gap-2">
              <button
                onClick={() => setShowPlaces((v) => !v)}
                className="pointer-events-auto rounded-full bg-slate-900 text-white text-xs font-bold px-4 py-2.5 shadow"
              >
                {showPlaces ? "✕ Close places" : "📍 Go somewhere"}
              </button>
              {showPlaces && (
                <div className="pointer-events-auto w-full rounded-3xl bg-white/95 shadow-xl p-2 max-h-[52vh] overflow-y-auto">
                  {LOCATIONS.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => goToLocation(l)}
                      className="w-full text-left rounded-2xl px-4 py-2.5 hover:bg-slate-100"
                    >
                      <div className="text-sm font-bold text-slate-800">{l.label}</div>
                      <div className="text-[11px] text-slate-500">{l.detail}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

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

          {showStreet && <TouchPad />}

          {/* venue walk shortcut */}
          {showMap && pickedId && (
            <button
              onClick={() => walkTo(pickedId)}
              className="absolute right-3 bottom-28 pointer-events-auto rounded-full bg-slate-900 text-white text-xs font-bold px-4 py-2.5 shadow"
            >
              Walk street →
            </button>
          )}

          {/* chat + sheets + tabs */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-[min(94vw,560px)] pointer-events-none">
            {(showMap || showStreet || tab === "home") && <ChatBar onSend={(t) => socket.sendChat(t, "zone")} />}
            {showStreet && near && (
              <div className="w-full max-w-md">
                <BuySheet onToast={say} refreshStatus={bump} />
              </div>
            )}
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
    </div>
  );
}

export default dynamic(() => Promise.resolve(World), { ssr: false });
