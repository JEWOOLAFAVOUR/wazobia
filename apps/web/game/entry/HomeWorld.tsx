"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { api } from "@/lib/api";
import { wallBoxes } from "@/game/world/yaba/derive";
import { ApartmentInterior, interiorColliders, interiorSpots, localBoxToWorld } from "@/game/world/yaba/interiors";
import { PlotShell } from "@/game/world/yaba/Hood";
import { homeOccluders } from "@/game/world/yaba/occluders";
import { makeTileMaps } from "@/game/world/yaba/floorTexture";
import { HOME_BOUNDS, HOME_EXIT, HOME_PLOT, HOME_SPAWN, hasCrossedHomeExit } from "@/game/navigation/locations";
import EntryPlayer, { type EntryPos } from "@/game/player/EntryPlayer";
import { findReachableTarget, type StepTarget } from "@/game/player/stepping";
import HomeResident from "@/game/entry/HomeResident";
import EntryCamera from "@/game/camera/EntryCamera";
import type { Avatar } from "@/game/character/wardrobe";
import type { Box } from "@/lib/collision";

const APT = HOME_PLOT;

type Spot = { id: string; title: string; detail: string; x: number; z: number; radius: number };

export default function HomeWorld({
  avatar,
  onToast,
  refreshStatus,
  spawn = HOME_SPAWN,
  onExit,
}: {
  avatar: Avatar;
  onToast: (msg: string | null) => void;
  refreshStatus: () => void;
  spawn?: EntryPos;
  /** Step outside through the front door — back to the Yaba street. */
  onExit?: () => void;
}) {
  const posRef = useRef<EntryPos>({ ...spawn });
  const [near, setNear] = useState<Spot | null>(null);
  const [marker, setMarker] = useState<StepTarget | null>(null);
  const moveTargetRef = useRef<StepTarget | null>(null);
  const markerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const occluders = useMemo(() => homeOccluders(), []);
  const floorMaps = useMemo(() => (typeof document === "undefined" ? null : makeTileMaps()), []);
  const onExitRef = useRef(onExit);
  useEffect(() => {
    onExitRef.current = onExit;
  }, [onExit]);
  useEffect(() => {
    return () => {
      if (markerTimer.current) clearTimeout(markerTimer.current);
    };
  }, []);
  useEffect(() => {
    return () => {
      floorMaps?.map.dispose();
      floorMaps?.roughnessMap.dispose();
    };
  }, [floorMaps]);

  const { colliders, spots } = useMemo(() => {
    const colliders: Box[] = wallBoxes(APT).map((b) => ({ x: b.x, z: b.z, hx: b.hx, hz: b.hz }));
    const dims = { w: APT.w - 0.7, d: APT.d - 0.7, interior: "apartment" as const };
    for (const b of interiorColliders(dims)) {
      const c = localBoxToWorld(APT, b);
      colliders.push(c);
    }
    // Front-door gap stays physically open — crossing it exits (see checkNear).
    const spots: Spot[] = interiorSpots("apartment").map((s) => ({ ...s, id: `home-${s.id}` }));
    spots.push({
      id: "home-spot-door",
      title: "Front door",
      detail: "Step outside to Yaba.",
      x: HOME_EXIT.x,
      z: HOME_EXIT.z - 1.6,
      radius: 2.2,
    });
    return { colliders, spots };
  }, []);

  const goToFloor = (x: number, z: number) => {
    // Tapping yourself does nothing — no toast, no target.
    if (Math.hypot(x - posRef.current.x, z - posRef.current.z) < 0.4) return;
    const dest = findReachableTarget(posRef.current, { x, z }, colliders, HOME_BOUNDS);
    if (!dest) {
      onToast("Can't get there — something is in the way.");
      return;
    }
    moveTargetRef.current = dest;
    setMarker(dest);
    if (markerTimer.current) clearTimeout(markerTimer.current);
    markerTimer.current = setTimeout(() => setMarker(null), 2200);
  };

  const nearRef = useRef<Spot | null>(null);
  useEffect(() => {
    nearRef.current = near;
  }, [near]);

  const checkNear = (x: number, z: number) => {
    // Walked out through the actual doorway → step outside to the street.
    if (hasCrossedHomeExit(x, z)) {
      onExitRef.current?.();
      return;
    }
    let best: Spot | null = null;
    let bd = Infinity;
    for (const s of spots) {
      const d = Math.hypot(x - s.x, z - s.z);
      if (d <= s.radius && d < bd) {
        bd = d;
        best = s;
      }
    }
    setNear((prev) => (prev?.id === best?.id ? prev : best));
  };

  const eat = async () => {
    try {
      const w = await api<{ inventory: { itemId: string; name: string }[] }>("/api/wallet");
      const first = w.inventory[0];
      if (!first) {
        onToast("Cooler is empty — buy food at the shop first.");
        return;
      }
      const r = await api<{ newEnergy: number }>("/api/inventory/eat", {
        method: "POST",
        body: JSON.stringify({ itemId: first.itemId }),
      });
      onToast(`Ate ${first.name} · energy ${r.newEnergy}`);
      refreshStatus();
    } catch (e) {
      onToast(e instanceof Error && e.message.includes("401") ? "Log in on the main page to eat." : "Nothing to eat right now.");
    }
  };

  const interact = () => {
    const n = nearRef.current;
    if (!n) return;
    if (n.id === "home-spot-door") {
      onExitRef.current?.();
      return;
    }
    if (n.id === "home-spot-kitchen") {
      eat();
      return;
    }
    if (n.id === "home-spot-bed") {
      onToast("A good sleep heals — day/night cycle arrives next.");
      return;
    }
    onToast(`${n.title} — ${n.detail}`);
  };

  useEffect(() => {
    if (!near) return;
    if (near.id === "home-spot-kitchen") onToast("Eat something — tap E at the counter.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [near?.id]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 9, 13], fov: 50 }}>
        <color attach="background" args={["#c9a6b8"]} />
        <ambientLight intensity={0.7} />
        <hemisphereLight args={["#ffe3d3", "#5a6b57", 0.55]} />
        <directionalLight position={[14, 22, 10]} intensity={1.7} color="#ffd9a0" castShadow shadow-mapSize={[1024, 1024]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
          <circleGeometry args={[26, 40]} />
          <meshStandardMaterial color="#a9c08a" roughness={1} />
        </mesh>
        <Suspense fallback={null}>
          <PlotShell plot={APT} ghost={false} roof={false} />
          {/* open door leaf on its hinge — the gap is the physical exit */}
          <group position={[APT.x - 1.05, 0, APT.z + APT.d / 2]} rotation={[0, -0.85, 0]}>
            <mesh position={[0.5, 1.3, 0]}>
              <boxGeometry args={[1.0, 2.6, 0.1]} />
              <meshStandardMaterial color="#6b4a2f" roughness={0.85} />
            </mesh>
            <mesh position={[0.85, 1.3, 0.08]}>
              <sphereGeometry args={[0.06, 10, 10]} />
              <meshStandardMaterial color="#d9a62e" roughness={0.4} metalness={0.6} />
            </mesh>
          </group>
          {/* stoop slab in the doorway */}
          <mesh position={[APT.x, 0.05, APT.z + APT.d / 2 + 0.4]} receiveShadow>
            <boxGeometry args={[2.6, 0.1, 1.6]} />
            <meshStandardMaterial color="#8a8478" roughness={1} />
          </mesh>
          <ApartmentInterior plot={APT} floorMap={floorMaps?.map} floorRoughness={floorMaps?.roughnessMap} onFloorClick={goToFloor} />
          {marker && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[marker.x, 0.09, marker.z]}>
              <ringGeometry args={[0.24, 0.34, 24]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.75} side={2} />
            </mesh>
          )}
          <HomeResident colliders={colliders} />
          <EntryPlayer
            key={`${spawn.x}:${spawn.z}`}
            avatar={avatar}
            initial={spawn}
            posRef={posRef}
            colliders={colliders}
            onMove={checkNear}
            onInteractKey={interact}
            moveTargetRef={moveTargetRef}
            onTargetDone={() => setMarker(null)}
          />
        </Suspense>
        <EntryCamera posRef={posRef} occluders={occluders} maxPitch={1.4} initialDist={12} initialPitch={0.95} maxDist={14} />
      </Canvas>
      {near && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-24 bg-white/95 rounded-full px-4 py-2 text-xs text-slate-700 shadow">
          <b>{near.title}</b> · press <b>E</b>
        </div>
      )}
    </div>
  );
}
