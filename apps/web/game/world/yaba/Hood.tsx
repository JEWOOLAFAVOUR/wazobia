"use client";

// YabaHood — the layout-driven neighbourhood. Every mesh below derives from
// layout.ts (roads, plots, frontage) and every collider from derive.ts, so
// what you see is what you collide with. Interiors are built in place inside
// their footprints: street → door gap → interior → door → same street.

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Box } from "@/lib/collision";
import {
  CURB_W,
  DRAIN_W,
  PLOTS,
  ROADS,
  SIDEWALK_W,
  plotAt,
  plotFacingVector,
  type Plot,
} from "./layout";
import { BUILDING_COLLIDERS, DOOR_INTERACTABLES, streetPieces, wallBoxes } from "./derive";
import { ApartmentInterior, RestaurantInterior, ShopInterior, interiorColliders, interiorSpots, localBoxToWorld, localToWorld } from "./interiors";
import { yawOfPlot } from "./interiorLayout";
import { Sign, StreetTree, UtilityPole } from "./parts";
import type { Interactable } from "../YabaBlock";

export type HoodData = { colliders: Box[]; spots: Interactable[] };

function buildHoodData(): HoodData {
  const colliders: Box[] = [...BUILDING_COLLIDERS];
  const spots: Interactable[] = [...DOOR_INTERACTABLES];
  for (const p of PLOTS) {
    if (!p.enterable || !p.interior) continue;
    const dims = { w: p.w - 0.7, d: p.d - 0.7, interior: p.interior };
    for (const b of interiorColliders(dims)) {
      colliders.push(localBoxToWorld(p, b));
    }
    for (const s of interiorSpots(p.interior)) {
      const w = localToWorld(p, s.x, s.z);
      spots.push({ id: `${p.id}-${s.id}`, title: s.title, detail: s.detail, x: w.x, z: w.z, radius: s.radius });
    }
  }
  return { colliders, spots };
}

export const HOOD: HoodData = buildHoodData();

export function plotAtPoint(x: number, z: number): Plot | null {
  const p = plotAt(x, z);
  return p && p.enterable ? p : null;
}

const FACADE: Record<Plot["kind"], string> = {
  shop: "#c98d4e",
  restaurant: "#e0cfa8",
  house: "#d8cfc0",
  apartment: "#cfd4d6",
  office: "#b9c2c7",
  bank: "#d7dee5",
  church: "#e8e4d8",
  mosque: "#9fd0c0",
  club: "#4a4258",
};

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[140, 140]} />
        <meshStandardMaterial color="#6b5b43" roughness={1} />
      </mesh>
      {ROADS.map((r) => {
        const alongX = r.axis === "x";
        const len = r.to - r.from;
        const mid = (r.from + r.to) / 2;
        return (
          <group key={r.id}>
            {/* asphalt */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={alongX ? [mid, 0.0, r.center] : [r.center, 0.0, mid]} receiveShadow>
              <planeGeometry args={alongX ? [len, r.width] : [r.width, len]} />
              <meshStandardMaterial color={r.main ? "#33363b" : "#3d3a34"} roughness={0.95} />
            </mesh>
            {/* centre dashes */}
            {Array.from({ length: Math.floor(len / 6) }, (_, i) => {
              const a = r.from + 3 + i * 6;
              return (
                <mesh
                  key={i}
                  rotation={[-Math.PI / 2, 0, 0]}
                  position={alongX ? [a, 0.02, r.center] : [r.center, 0.02, a]}
                >
                  <planeGeometry args={alongX ? [1.8, 0.25] : [0.25, 1.8]} />
                  <meshStandardMaterial color="#d8c84a" roughness={1} />
                </mesh>
              );
            })}
            {/* sidewalks + curbs + drains, both sides */}
            {[-1, 1].map((side) => {
              const kerbOff = r.width / 2 + CURB_W / 2;
              const walkOff = r.width / 2 + CURB_W + SIDEWALK_W / 2;
              const drainOff = r.width / 2 + CURB_W + SIDEWALK_W + DRAIN_W / 2;
              const at = (off: number): [number, number, number] =>
                alongX ? [mid, 0.015, r.center + side * off] : [r.center + side * off, 0.015, mid];
              const size = (w: number): [number, number] => (alongX ? [len, w] : [w, len]);
              return (
                <group key={side}>
                  <mesh rotation={[-Math.PI / 2, 0, 0]} position={at(walkOff)} receiveShadow>
                    <planeGeometry args={size(SIDEWALK_W)} />
                    <meshStandardMaterial color="#8a8478" roughness={1} />
                  </mesh>
                  <mesh rotation={[-Math.PI / 2, 0, 0]} position={at(kerbOff)}>
                    <planeGeometry args={size(CURB_W)} />
                    <meshStandardMaterial color="#a09a8c" roughness={1} />
                  </mesh>
                  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[at(drainOff)[0], 0.005, at(drainOff)[2]]}>
                    <planeGeometry args={size(DRAIN_W)} />
                    <meshStandardMaterial color="#2c2f33" roughness={1} />
                  </mesh>
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

function GhostWall({ box, h, color, ghost }: { box: Box; h: number; color: string; ghost: boolean }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const target = useRef(1);
  useFrame((_, dt) => {
    target.current = ghost ? 0.15 : 1;
    const m = mat.current;
    if (!m) return;
    m.opacity += (target.current - m.opacity) * Math.min(1, 6 * dt);
  });
  return (
    <mesh position={[box.x, h / 2, box.z]} castShadow receiveShadow>
      <boxGeometry args={[box.hx * 2, h, box.hz * 2]} />
      <meshStandardMaterial ref={mat} color={color} roughness={0.95} transparent opacity={1} depthWrite={!ghost} />
    </mesh>
  );
}

const TRIM = "#f2ece0";
const GLASS = "#202b36";

function FadeMat({ ghost, color, roughness = 0.9 }: { ghost: boolean; color: string; roughness?: number }) {
  return <meshStandardMaterial color={color} roughness={roughness} transparent={ghost} opacity={ghost ? 0.15 : 1} depthWrite={!ghost} />;
}

/** Window unit in plot-local frame. `side` rotates it onto a side wall. */
function WindowUnit({ x, z, side, ghost }: { x: number; z: number; side?: boolean; ghost: boolean }) {
  const frame: [number, number, number] = side ? [0.12, 1.4, 1.6] : [1.6, 1.4, 0.12];
  const glass: [number, number, number] = side ? [0.14, 1.1, 1.3] : [1.3, 1.1, 0.14];
  const sill: [number, number, number] = side ? [0.24, 0.12, 1.8] : [1.8, 0.12, 0.24];
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.75, 0]}>
        <boxGeometry args={frame} />
        <FadeMat ghost={ghost} color={TRIM} />
      </mesh>
      <mesh position={[0, 1.75, 0]}>
        <boxGeometry args={glass} />
        <FadeMat ghost={ghost} color={GLASS} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={sill} />
        <FadeMat ghost={ghost} color={TRIM} />
      </mesh>
    </group>
  );
}

/**
 * Finished facade trim in plot-local frame (front = +z): plinth, cornice,
 * corner boards covering raw box edges, windows and a door canopy / entry.
 * Enterable plots get windows only on the front (their side walls are seen
 * from inside, where exterior trim would read as dark patches).
 */
function FacadeDetails({ plot, wallH, ghost }: { plot: Plot; wallH: number; ghost: boolean }) {
  const hw = plot.w / 2;
  const hd = plot.d / 2;
  const frontXs = plot.enterable ? [(-hw - 1.1) / 2, (hw + 1.1) / 2] : [-hw / 2, hw / 2];
  return (
    <group>
      {/* plinth + cornice */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[plot.w + 0.24, 0.5, plot.d + 0.24]} />
        <FadeMat ghost={ghost} color="#8a8072" />
      </mesh>
      <mesh position={[0, wallH - 0.14, 0]}>
        <boxGeometry args={[plot.w + 0.36, 0.28, plot.d + 0.36]} />
        <FadeMat ghost={ghost} color={TRIM} />
      </mesh>
      {/* corner boards */}
      {[
        [-hw, -hd],
        [hw, -hd],
        [-hw, hd],
        [hw, hd],
      ].map((c, i) => (
        <mesh key={i} position={[c[0], wallH / 2, c[1]]}>
          <boxGeometry args={[0.36, wallH, 0.36]} />
          <FadeMat ghost={ghost} color={TRIM} />
        </mesh>
      ))}
      {/* front windows */}
      {frontXs.map((cx, i) => (
        <WindowUnit key={i} x={cx} z={hd} ghost={ghost} />
      ))}
      {/* side windows only for solid (non-enterable) plots */}
      {!plot.enterable &&
        [-1, 1].map((s) =>
          [0].map((_, j) => <WindowUnit key={`${s}${j}`} x={s * hw} z={0} side ghost={ghost} />),
        )}
      {plot.enterable ? (
        /* door canopy over the real opening */
        <mesh position={[0, 2.95, hd + 0.55]}>
          <boxGeometry args={[3.0, 0.14, 1.1]} />
          <FadeMat ghost={ghost} color="#3a3733" />
        </mesh>
      ) : (
        /* recessed entry visual — the wall itself stays solid, matching collision */
        <group>
          <mesh position={[0, 1.3, hd + 0.01]}>
            <boxGeometry args={[2.2, 2.6, 0.1]} />
            <FadeMat ghost={ghost} color="#2c2620" />
          </mesh>
          <mesh position={[0, 0.08, hd + 0.6]}>
            <boxGeometry args={[2.6, 0.16, 1.2]} />
            <FadeMat ghost={ghost} color="#8a8478" />
          </mesh>
        </group>
      )}
    </group>
  );
}

export function PlotShell({ plot, ghost, roof = true }: { plot: Plot; ghost: boolean; roof?: boolean }) {
  const boxes = wallBoxes(plot);
  const front = plot.enterable ? boxes.slice(0, 2) : [];
  const rest = plot.enterable ? boxes.slice(2) : boxes;
  const color = FACADE[plot.kind];
  const wallH = plot.enterable ? 3.6 : plot.height;
  const { fx, fz } = plotFacingVector(plot.facing);
  // door frame on the frontage
  const doorCX = plot.x + fx * (plot.d / 2);
  const doorCZ = plot.z + fz * (plot.d / 2);
  return (
    <group>
      {front.map((b, i) => (
        <GhostWall key={`f${i}`} box={b} h={wallH} color={color} ghost={ghost} />
      ))}
      {rest.map((b, i) => (
        <mesh key={`r${i}`} position={[b.x, wallH / 2, b.z]} castShadow receiveShadow>
          <boxGeometry args={[b.hx * 2, wallH, b.hz * 2]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
      ))}
      {roof &&
        (plot.enterable ? (
          <mesh position={[plot.x, wallH + 0.18, plot.z]}>
            <boxGeometry args={[plot.w + 0.3, 0.36, plot.d + 0.3]} />
            <meshStandardMaterial color="#3a3733" roughness={1} />
          </mesh>
        ) : (
          <mesh position={[plot.x, wallH + 0.15, plot.z]} castShadow>
            <boxGeometry args={[plot.w + 0.4, 0.3, plot.d + 0.4]} />
            <meshStandardMaterial color="#4a4239" roughness={1} />
          </mesh>
        ))}
      {/* finished trim in plot-local frame (front = door side) */}
      <group position={[plot.x, 0, plot.z]} rotation={[0, yawOfPlot(plot), 0]}>
        <FacadeDetails plot={plot} wallH={wallH} ghost={ghost} />
      </group>
      {/* door frame + step */}
      <group position={[doorCX, 0, doorCZ]} rotation={[0, Math.atan2(fx, fz), 0]}>
        {[-1.35, 1.35].map((dx, i) => (
          <mesh key={i} position={[dx, 1.3, 0]} castShadow>
            <boxGeometry args={[0.28, 2.6, 0.5]} />
            <meshStandardMaterial color="#4a3826" roughness={0.9} />
          </mesh>
        ))}
        <mesh position={[0, 2.7, 0]}>
          <boxGeometry args={[3.0, 0.28, 0.5]} />
          <meshStandardMaterial color="#4a3826" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.08, 0.9]} receiveShadow>
          <boxGeometry args={[2.6, 0.16, 1.4]} />
          <meshStandardMaterial color="#8a8478" roughness={1} />
        </mesh>
      </group>
      <group position={[doorCX + fx * 0.3, 3.9, doorCZ + fz * 0.3]}>
        <Sign text={plot.name.toUpperCase()} color={plot.kind === "club" ? "#c77dff" : "#f5b301"} />
      </group>
    </group>
  );
}

function WaterTank({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {[
        [-0.8, -0.8],
        [0.8, -0.8],
        [-0.8, 0.8],
        [0.8, 0.8],
      ].map((p, i) => (
        <mesh key={i} position={[p[0], 1.1, p[1]]}>
          <boxGeometry args={[0.18, 2.2, 0.18]} />
          <meshStandardMaterial color="#4a4a4a" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 2.9, 0]} castShadow>
        <cylinderGeometry args={[1.1, 1.1, 1.4, 12]} />
        <meshStandardMaterial color="#1c1c1e" roughness={0.8} />
      </mesh>
      <mesh position={[0, 3.65, 0]}>
        <cylinderGeometry args={[1.15, 1.15, 0.12, 12]} />
        <meshStandardMaterial color="#2c2c2e" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Generator({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[1.4, 0.9, 0.8]} />
        <meshStandardMaterial color="#7a2020" roughness={0.8} />
      </mesh>
      <mesh position={[0.4, 1.1, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.5, 6]} />
        <meshStandardMaterial color="#1c1c1e" roughness={0.9} />
      </mesh>
    </group>
  );
}

function ACUnit({ x, y, z, rot = 0 }: { x: number; y: number; z: number; rot?: number }) {
  return (
    <mesh position={[x, y, z]} rotation={[0, rot, 0]}>
      <boxGeometry args={[0.8, 0.55, 0.35]} />
      <meshStandardMaterial color="#cfd4d6" roughness={0.7} />
    </mesh>
  );
}

function CompoundWalls({ plot }: { plot: Plot }) {
  // Perimeter wall with a gate gap on the street side (Adeyemi Compound).
  const h = 2.2;
  const t = 0.3;
  const hw = plot.w / 2 + 2;
  const hd = plot.d / 2 + 2;
  return (
    <group position={[plot.x, 0, plot.z]}>
      {/* rear + sides full */}
      <mesh position={[0, h / 2, -hd]}>
        <boxGeometry args={[hw * 2, h, t]} />
        <meshStandardMaterial color="#c9bfa8" roughness={1} />
      </mesh>
      <mesh position={[0, h + 0.06, -hd]}>
        <boxGeometry args={[hw * 2 + 0.12, 0.12, t + 0.12]} />
        <meshStandardMaterial color="#f2ece0" roughness={1} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * hw, h / 2, 0]}>
            <boxGeometry args={[t, h, hd * 2]} />
            <meshStandardMaterial color="#c9bfa8" roughness={1} />
          </mesh>
          <mesh position={[s * hw, h + 0.06, 0]}>
            <boxGeometry args={[t + 0.12, 0.12, hd * 2]} />
            <meshStandardMaterial color="#f2ece0" roughness={1} />
          </mesh>
        </group>
      ))}
      {/* front split around a 3m gate */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * (1.5 + (hw - 1.5) / 2), h / 2, hd]}>
            <boxGeometry args={[hw - 1.5, h, t]} />
            <meshStandardMaterial color="#c9bfa8" roughness={1} />
          </mesh>
          <mesh position={[s * (1.5 + (hw - 1.5) / 2), h + 0.06, hd]}>
            <boxGeometry args={[hw - 1.5, 0.12, t + 0.12]} />
            <meshStandardMaterial color="#f2ece0" roughness={1} />
          </mesh>
        </group>
      ))}
      {[-1.7, 1.7].map((dx, i) => (
        <mesh key={i} position={[dx, 1.4, hd]} castShadow>
          <boxGeometry args={[0.4, 2.8, 0.4]} />
          <meshStandardMaterial color="#4a3826" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Landmark({ plot }: { plot: Plot }) {
  if (plot.kind === "church") {
    return (
      <group position={[plot.x, plot.height, plot.z]}>
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[0.25, 1.8, 0.25]} />
          <meshStandardMaterial color="#e8e4d8" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[0.9, 0.25, 0.25]} />
          <meshStandardMaterial color="#e8e4d8" roughness={0.8} />
        </mesh>
      </group>
    );
  }
  if (plot.kind === "mosque") {
    return (
      <group position={[plot.x, plot.height, plot.z]}>
        <mesh position={[0, 0.8, 0]}>
          <sphereGeometry args={[2.2, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#4db6a3" roughness={0.7} />
        </mesh>
        <mesh position={[3.5, 2.2, 0]}>
          <cylinderGeometry args={[0.5, 0.6, 7, 8]} />
          <meshStandardMaterial color="#e8e4d8" roughness={0.8} />
        </mesh>
      </group>
    );
  }
  if (plot.kind === "bank") {
    return (
      <group position={[plot.x - plot.w / 2 + 1.2, 0, plot.z - plot.d / 2 - 0.6]}>
        <mesh position={[0, 1.1, 0]} castShadow>
          <boxGeometry args={[1.2, 2.2, 0.8]} />
          <meshStandardMaterial color="#3d7bc2" roughness={0.6} />
        </mesh>
      </group>
    );
  }
  return null;
}

export default function YabaHood({ insideId }: { insideId: string | null }) {
  const pieces = streetPieces();
  return (
    <group>
      <Ground />
      {/* street furniture derived from the road list */}
      {pieces.map((p) =>
        p.kind === "pole" ? (
          <UtilityPole key={p.id} position={[p.x, 0, p.z]} />
        ) : (
          <mesh key={p.id} position={[p.x, 0.4, p.z]}>
            <boxGeometry args={[0.7, 0.8, 0.7]} />
            <meshStandardMaterial color="#2f6b46" roughness={0.9} />
          </mesh>
        ),
      )}
      {PLOTS.map((p) => (
        <group key={p.id}>
          <PlotShell plot={p} ghost={insideId === p.id} />
          {p.id === "rest-1" && <RestaurantInterior plot={p} />}
          {p.id === "shop-1" && <ShopInterior plot={p} />}
          {p.id === "apt-1" && <ApartmentInterior plot={p} />}
          {p.id === "house-1" && <CompoundWalls plot={p} />}
          <Landmark plot={p} />
        </group>
      ))}
      {/* Lagos details */}
      <WaterTank x={-22} z={-20} />
      <WaterTank x={-8} z={14} />
      <Generator x={19} z={-4.2} rot={0.2} />
      <Generator x={-20} z={12.5} rot={-0.3} />
      <ACUnit x={-14} y={5.4} z={1.9} />
      <ACUnit x={-28} y={4.6} z={1.9} />
      {/* trees on setbacks */}
      {[
        [-38, -14, 1.1],
        [38, 12, 1.2],
        [-38, 14, 0.9],
        [8, -32, 1],
        [-8, 34, 1.1],
      ].map((t, i) => (
        <StreetTree key={i} position={[t[0], 0, t[1]]} s={t[2] as number} />
      ))}
      {/* bus stop + parked danfo */}
      <group position={[8, 0, 11.5]}>
        <mesh position={[0, 1.3, 0]} castShadow>
          <boxGeometry args={[4.5, 0.15, 1.8]} />
          <meshStandardMaterial color="#274b73" roughness={0.8} />
        </mesh>
        {[-2, 2].map((dx, i) => (
          <mesh key={i} position={[dx, 0.65, -0.7]}>
            <boxGeometry args={[0.15, 1.3, 0.15]} />
            <meshStandardMaterial color="#4a4a4a" roughness={0.8} />
          </mesh>
        ))}
        <mesh position={[0, 0.45, -0.4]}>
          <boxGeometry args={[3.6, 0.08, 0.5]} />
          <meshStandardMaterial color="#5a3a24" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}
