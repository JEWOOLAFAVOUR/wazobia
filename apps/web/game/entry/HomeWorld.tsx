"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { api } from "@/lib/api";
import { PLOTS } from "@/game/world/yaba/layout";
import { wallBoxes } from "@/game/world/yaba/derive";
import { ApartmentInterior, interiorColliders, interiorSpots, localBoxToWorld } from "@/game/world/yaba/interiors";
import { PlotShell } from "@/game/world/yaba/Hood";
import EntryPlayer, { type EntryPos } from "@/game/player/EntryPlayer";
import EntryCamera from "@/game/camera/EntryCamera";
import type { Avatar } from "@/game/character/wardrobe";
import type { Box } from "@/lib/collision";

const APT = (() => {
  const p = PLOTS.find((x) => x.id === "apt-1") ?? PLOTS[0];
  return { ...p, x: 0, z: 0, facing: "+z" as const };
})();

type Spot = { id: string; title: string; detail: string; x: number; z: number; radius: number };

export default function HomeWorld({
  avatar,
  onToast,
  refreshStatus,
}: {
  avatar: Avatar;
  onToast: (msg: string | null) => void;
  refreshStatus: () => void;
}) {
  const posRef = useRef<EntryPos>({ x: -3.2, z: 3.4, heading: Math.PI });
  const [near, setNear] = useState<Spot | null>(null);

  const { colliders, spots } = useMemo(() => {
    const colliders: Box[] = wallBoxes(APT).map((b) => ({ x: b.x, z: b.z, hx: b.hx, hz: b.hz }));
    const dims = { w: APT.w - 0.7, d: APT.d - 0.7, interior: "apartment" as const };
    for (const b of interiorColliders(dims)) {
      const c = localBoxToWorld(APT, b);
      colliders.push(c);
    }
    const spots: Spot[] = interiorSpots("apartment").map((s) => ({ ...s, id: `home-${s.id}` }));
    return { colliders, spots };
  }, []);

  const nearRef = useRef<Spot | null>(null);
  useEffect(() => {
    nearRef.current = near;
  }, [near]);

  const checkNear = (x: number, z: number) => {
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
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 9, 13], fov: 50 }}>
        <color attach="background" args={["#c9a6b8"]} />
        <ambientLight intensity={0.7} />
        <hemisphereLight args={["#ffe3d3", "#5a6b57", 0.55]} />
        <directionalLight position={[14, 22, 10]} intensity={1.7} color="#ffd9a0" castShadow shadow-mapSize={[2048, 2048]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
          <circleGeometry args={[26, 40]} />
          <meshStandardMaterial color="#a9c08a" roughness={1} />
        </mesh>
        <Suspense fallback={null}>
          <PlotShell plot={APT} ghost={false} />
          <ApartmentInterior plot={APT} />
          <EntryPlayer
            avatar={avatar}
            initial={{ x: -3.2, z: 3.4, heading: Math.PI }}
            posRef={posRef}
            colliders={colliders}
            onMove={checkNear}
            onInteractKey={interact}
          />
        </Suspense>
        <EntryCamera posRef={posRef} />
      </Canvas>
      {near && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-24 bg-white/95 rounded-full px-4 py-2 text-xs text-slate-700 shadow">
          <b>{near.title}</b> · press <b>E</b>
        </div>
      )}
    </div>
  );
}
