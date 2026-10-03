"use client";

import { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Building } from "@/lib/api";
import { nearestBuilding } from "@/lib/collision";
import { useSocket } from "@/game/networking/useSocket";
import YabaMap from "@/game/world/YabaMap";
import { LocalPlayer, RemotePlayers, type Pos } from "@/game/player/Player";
import FollowCam from "@/game/camera/FollowCam";

export type Proximity = { id: string; name: string; kind: string; d: number } | null;

export default function YabaScene({
  buildings,
  userId,
  onProximity,
  onCount,
}: {
  buildings: Building[];
  userId: string;
  onProximity?: (p: Proximity) => void;
  onCount?: (n: number) => void;
}) {
  const posRef = useRef<Pos>({ x: 0, z: 12 });
  const [follow, setFollow] = useState(true);
  const { remotes, connected } = useSocket(userId, "zone-b", posRef);

  const handleMove = (x: number, z: number) => {
    const hit = nearestBuilding(x, z, buildings, 5.5);
    onProximity?.(hit ? { id: hit.b.id, name: hit.b.name, kind: hit.b.kind, d: hit.d } : null);
    onCount?.(remotes.size + 1);
  };

  return (
    <div className="relative">
      <Canvas camera={{ position: [0, 16, 26], fov: 50 }} style={{ height: "62vh" }} shadows>
        <ambientLight intensity={0.75} />
        <directionalLight position={[20, 30, 10]} intensity={1.3} castShadow />
        <YabaMap buildings={buildings} />
        <LocalPlayer posRef={posRef} buildings={buildings} onMove={handleMove} />
        <RemotePlayers remotes={remotes} />
        <FollowCam posRef={posRef} enabled={follow} />
        {!follow && <OrbitControls makeDefault />}
      </Canvas>
      <div className="absolute top-3 left-3 flex gap-2 text-xs">
        <button
          onClick={() => setFollow((f) => !f)}
          className="rounded-full bg-black/70 px-3 py-1.5 text-white border border-white/15 hover:bg-black"
        >
          {follow ? "Follow cam (click for orbit)" : "Orbit cam (click for follow)"}
        </button>
        <div className={`rounded-full px-3 py-1.5 border ${connected ? "bg-green-900/70 border-green-700 text-green-200" : "bg-red-900/70 border-red-700 text-red-200"}`}>
          {connected ? `live · ${remotes.size + 1} here` : "connecting…"}
        </div>
      </div>
    </div>
  );
}
