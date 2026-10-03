"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, MapControls } from "@react-three/drei";
import * as THREE from "three";
import { PLOTS, ROADS, plotFacingVector } from "@/game/world/yaba/layout";

export type MapFocus = { x: number; z: number };

const KIND_COLOR: Record<string, string> = {
  shop: "#e8b04b",
  restaurant: "#e8b04b",
  house: "#d8cfc0",
  apartment: "#cfd4d6",
  office: "#b9c2c7",
  bank: "#9fc3e0",
  church: "#f2ede0",
  mosque: "#9fd0c0",
  club: "#6b5f86",
};

/**
 * Robust map controls: left-drag / one-finger pans, wheel / pinch zooms,
 * two-finger drag pans on touch. No rotation (map stays north-up like reference).
 * focusRef stays in sync both ways so venue chips can fly the camera.
 */
export function MapCamera({ focusRef }: { focusRef: React.MutableRefObject<MapFocus> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controls = useRef<any>(null);
  const goal = useRef(new THREE.Vector3(0, 0, 0));
  const last = useRef({ x: 0, z: 0 });
  const focus = useRef(focusRef);
  useEffect(() => {
    focus.current = focusRef;
  }, [focusRef]);

  useFrame((_, rawDt) => {
    const c = controls.current as { target: THREE.Vector3; update: () => void } | null;
    if (!c) return;
    const dt = Math.min(rawDt, 0.05);
    const f = focus.current.current;
    // External focus request (venue chip click) — fly target there.
    if (last.current.x !== f.x || last.current.z !== f.z) {
      last.current = { x: f.x, z: f.z };
      goal.current.set(f.x, 0, f.z);
    }
    c.target.lerp(goal.current, 1 - Math.exp(-8 * dt));
    // User panned — keep the ref in sync for the next external request.
    goal.current.copy(c.target);
    f.x = c.target.x;
    f.z = c.target.z;
    c.update();
  });

  return (
    <MapControls
      ref={controls}
      makeDefault
      enableRotate={false}
      enableDamping
      dampingFactor={0.12}
      screenSpacePanning={false}
      minDistance={18}
      maxDistance={110}
      maxPolarAngle={Math.PI / 3.2}
      mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
      touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN }}
    />
  );
}

type House = { x: number; z: number; rot: number; c: string };

function buildEstates(): { mainland: House[]; lekki: House[] } {
  const mainland: House[] = [];
  const lekki: House[] = [];
  // Mainland housing belt (west-north), cream/tan rows like the reference top-left.
  const creams = ["#e5d9bd", "#ded0b2", "#e8dcc3", "#d9c9a6"];
  for (let ix = 0; ix < 8; ix++) {
    for (let iz = 0; iz < 6; iz++) {
      mainland.push({
        x: -54 + ix * 3.4,
        z: -40 + iz * 3.6,
        rot: 0,
        c: creams[(ix + iz) % creams.length],
      });
    }
  }
  // Lekki Estate (east island), green bungalows in a strict grid like the reference right side.
  for (let ix = 0; ix < 10; ix++) {
    for (let iz = 0; iz < 8; iz++) {
      lekki.push({
        x: 24 + ix * 3.2,
        z: 12 + iz * 3.1,
        rot: 0,
        c: (ix + iz) % 5 === 0 ? "#3f7d4e" : "#4c9159",
      });
    }
  }
  return { mainland, lekki };
}

function EstateInstances({ houses, y = 0 }: { houses: House[]; y?: number }) {
  const bodies = useRef<THREE.InstancedMesh>(null);
  const roofs = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colors = useMemo(() => houses.map((h) => new THREE.Color(h.c)), [houses]);

  useLayoutEffect(() => {
    const b = bodies.current;
    const r = roofs.current;
    if (!b || !r) return;
    houses.forEach((h, i) => {
      dummy.position.set(h.x, y + 0.7, h.z);
      dummy.rotation.set(0, h.rot, 0);
      dummy.updateMatrix();
      b.setMatrixAt(i, dummy.matrix);
      b.setColorAt(i, colors[i]);
      dummy.position.set(h.x, y + 1.55, h.z);
      dummy.rotation.set(0, h.rot, 0);
      dummy.updateMatrix();
      r.setMatrixAt(i, dummy.matrix);
    });
    b.instanceMatrix.needsUpdate = true;
    r.instanceMatrix.needsUpdate = true;
    if (b.instanceColor) b.instanceColor.needsUpdate = true;
  }, [houses, colors, dummy, y]);

  return (
    <group>
      <instancedMesh ref={bodies} args={[undefined, undefined, houses.length]} frustumCulled={false}>
        <boxGeometry args={[2.3, 1.4, 2.7]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
      <instancedMesh ref={roofs} args={[undefined, undefined, houses.length]} frustumCulled={false}>
        <boxGeometry args={[2.6, 0.3, 3.0]} />
        <meshStandardMaterial color="#3d3831" roughness={1} />
      </instancedMesh>
    </group>
  );
}

function RegionLabel({ position, children }: { position: [number, number, number]; children: string }) {
  return (
    <group position={position}>
      <Html center distanceFactor={120} wrapperClass="venue-label" style={{ pointerEvents: "none" }}>
        <div
          style={{
            pointerEvents: "none",
            userSelect: "none",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.22em",
            color: "rgba(255,255,255,0.85)",
            textShadow: "0 1px 6px rgba(15,40,60,0.5)",
            whiteSpace: "nowrap",
          }}
        >
          {children}
        </div>
      </Html>
    </group>
  );
}

/** Lightweight static Lagos slab — no interiors, no per-mesh useFrame. Coordinates match street 1:1. */
export function LagosMapBlocks({ onPick }: { onPick?: (plotId: string) => void }) {
  const roads = useMemo(() => ROADS, []);
  const plots = useMemo(() => PLOTS, []);
  const estates = useMemo(() => buildEstates(), []);
  const downAt = useRef<{ x: number; y: number } | null>(null);

  return (
    <group>
      {/* ocean */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}>
        <planeGeometry args={[240, 240]} />
        <meshStandardMaterial color="#6fb3d2" roughness={1} />
      </mesh>
      {/* mainland slab */}
      <mesh position={[-8, -0.12, -22]}>
        <boxGeometry args={[120, 0.5, 60]} />
        <meshStandardMaterial color="#a9c08a" roughness={1} />
      </mesh>
      {/* island slab */}
      <mesh position={[8, -0.12, 24]}>
        <boxGeometry args={[110, 0.5, 52]} />
        <meshStandardMaterial color="#e6d9b8" roughness={1} />
      </mesh>
      {/* lagoon strip */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, 4.5]}>
        <planeGeometry args={[120, 7]} />
        <meshStandardMaterial color="#5da9cc" roughness={1} />
      </mesh>
      {/* estate ground tints */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-42, 0.1, -30]}>
        <planeGeometry args={[30, 24]} />
        <meshStandardMaterial color="#b3c48f" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[38, 0.1, 23]}>
        <planeGeometry args={[34, 27]} />
        <meshStandardMaterial color="#9dbb7f" roughness={1} />
      </mesh>
      {/* Yaba roads, true coordinates */}
      {roads.map((r) => {
        const alongX = r.axis === "x";
        const len = r.to - r.from;
        const mid = (r.from + r.to) / 2;
        return (
          <mesh
            key={r.id}
            rotation={[-Math.PI / 2, 0, 0]}
            position={alongX ? [mid, 0.16, r.center] : [r.center, 0.16, mid]}
          >
            <planeGeometry args={alongX ? [Math.min(len, 118), r.width] : [r.width, len]} />
            <meshStandardMaterial color={r.main ? "#3a3d42" : "#4a463d"} roughness={1} />
          </mesh>
        );
      })}
      {/* housing estates (2 draw calls via instancing) */}
      <EstateInstances houses={estates.mainland} />
      <EstateInstances houses={estates.lekki} />
      {/* Yaba plots as massing blocks — click only counts when it wasn't a drag */}
      <group
        onPointerDown={(e) => {
          downAt.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
        }}
      >
        {plots.map((p) => {
          const h = Math.max(2.2, Math.min(p.height, 9));
          return (
            <group key={p.id}>
              <mesh
                position={[p.x, h / 2, p.z]}
                onClick={(e) => {
                  const d = downAt.current;
                  downAt.current = null;
                  if (d && Math.hypot(e.nativeEvent.clientX - d.x, e.nativeEvent.clientY - d.y) > 6) return;
                  e.stopPropagation();
                  onPick?.(p.id);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = "pointer";
                }}
                onPointerOut={() => {
                  document.body.style.cursor = "";
                }}
              >
                <boxGeometry args={[p.w, h, p.d]} />
                <meshStandardMaterial color={KIND_COLOR[p.kind] ?? "#d8cfc0"} roughness={0.95} />
              </mesh>
              {/* roof cap */}
              <mesh position={[p.x, h + 0.12, p.z]}>
                <boxGeometry args={[p.w + 0.3, 0.24, p.d + 0.3]} />
                <meshStandardMaterial color="#4a4239" roughness={1} />
              </mesh>
            </group>
          );
        })}
      </group>
      {/* trees: static scatter */}
      {[
        [-40, -14],
        [38, 12],
        [-38, 14],
        [8, -32],
        [-8, 34],
      ].map((t, i) => (
        <group key={i} position={[t[0], 0, t[1]]}>
          <mesh position={[0, 1.1, 0]}>
            <cylinderGeometry args={[0.18, 0.24, 2.2, 6]} />
            <meshStandardMaterial color="#6b4a2f" roughness={1} />
          </mesh>
          <mesh position={[0, 2.8, 0]}>
            <coneGeometry args={[1.3, 2.4, 7]} />
            <meshStandardMaterial color="#2f6b46" roughness={1} />
          </mesh>
        </group>
      ))}
      <RegionLabel position={[0, 0.4, 4.5]}>LAGOS LAGOON</RegionLabel>
      <RegionLabel position={[38, 0.4, 38]}>LEKKI ESTATE</RegionLabel>
      <RegionLabel position={[-20, 0.4, 52]}>EKO ATLANTIC</RegionLabel>
    </group>
  );
}

export function streetDoor(plotId: string): { x: number; z: number } | null {
  const p = PLOTS.find((x) => x.id === plotId);
  if (!p) return null;
  const { fx, fz } = plotFacingVector(p.facing);
  return { x: p.x + fx * (p.d / 2 + 2.2), z: p.z + fz * (p.d / 2 + 2.2) };
}
