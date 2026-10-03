"use client";

// Interiors are built IN PLACE inside their plot footprints — same scene,
// same street, walk in through the derived door gap. No teleports, no modals.
// Local frame: x in [-w/2, w/2], z in [-d/2, d/2], front (door side) at +z.
// Colliders + spots are derived from the same local specs as the visuals.

import type { Plot } from "./layout";
import { yawOfPlot } from "./interiorLayout";

export type { LocalBox, LocalSpot } from "./interiorLayout";
export { interiorColliders, interiorSpots, localBoxToWorld, localToWorld } from "./interiorLayout";

export function InteriorGroup({ plot, children }: { plot: Plot; children: React.ReactNode }) {
  return (
    <group position={[plot.x, 0, plot.z]} rotation={[0, yawOfPlot(plot), 0]}>
      {children}
    </group>
  );
}

function Slab({ w, d, color = "#b8a88e" }: { w: number; d: number; color?: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} receiveShadow>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
}

function TableSet({ x, z, color = "#7a4a28" }: { x: number; z: number; color?: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.06, 14]} />
        <meshStandardMaterial color="#eceae6" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.72, 8]} />
        <meshStandardMaterial color="#274b73" roughness={0.6} />
      </mesh>
      {[
        [0.95, 0],
        [-0.48, 0.83],
        [-0.48, -0.83],
      ].map((p, i) => (
        <group key={i} position={[p[0], 0, p[1]]}>
          <mesh position={[0, 0.44, 0]}>
            <boxGeometry args={[0.42, 0.05, 0.42]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <boxGeometry args={[0.06, 0.44, 0.06]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ShelfUnit({ x, z, rot = 0, goods = ["#c96a2c", "#2e6b46", "#a83a32"] }: { x: number; z: number; rot?: number; goods?: string[] }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[2.4, 1.6, 0.7]} />
        <meshStandardMaterial color="#5a3a24" roughness={0.9} />
      </mesh>
      {[0.45, 0.95, 1.4].map((y, r) => (
        <group key={r} position={[0, y, 0.12]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[-0.9 + i * 0.6, 0.12, 0]}>
              <boxGeometry args={[0.4, 0.24, 0.4]} />
              <meshStandardMaterial color={goods[(r + i) % goods.length]} roughness={0.8} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Counter({ x, z, w = 4, color = "#8a5a2e" }: { x: number; z: number; w?: number; color?: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 1.1, 0.8]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.13, 0]}>
        <boxGeometry args={[w + 0.15, 0.06, 0.95]} />
        <meshStandardMaterial color="#3d3a45" roughness={0.6} />
      </mesh>
    </group>
  );
}

export function RestaurantInterior({ plot }: { plot: Plot }) {
  const w = plot.w - 0.7;
  const d = plot.d - 0.7;
  return (
    <InteriorGroup plot={plot}>
      <Slab w={w} d={d} color="#c9b896" />
      {/* kitchen pass at the back */}
      <mesh position={[0, 1.3, -d / 2 + 0.2]}>
        <boxGeometry args={[3.2, 1.4, 0.1]} />
        <meshStandardMaterial color="#141210" roughness={1} />
      </mesh>
      <mesh position={[0, 2.15, -d / 2 + 0.2]}>
        <boxGeometry args={[3.6, 0.3, 0.14]} />
        <meshStandardMaterial color="#5a3a24" roughness={0.9} />
      </mesh>
      <Counter x={0} z={-d / 2 + 1.6} w={4.4} />
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-1.4 + i * 1.4, 0.5, -d / 2 + 2.5]}>
          <cylinderGeometry args={[0.22, 0.26, 0.5, 10]} />
          <meshStandardMaterial color="#274b73" roughness={0.7} />
        </mesh>
      ))}
      <TableSet x={-2.2} z={0.6} />
      <TableSet x={2.2} z={0.6} />
      {/* pendant lights */}
      {[-2.2, 0, 2.2].map((x, i) => (
        <group key={i} position={[x, 0, 0.6]}>
          <mesh position={[0, 3.1, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.8, 6]} />
            <meshStandardMaterial color="#141210" roughness={1} />
          </mesh>
          <mesh position={[0, 2.65, 0]}>
            <sphereGeometry args={[0.14, 10, 10]} />
            <meshStandardMaterial color="#ffe9a3" emissive="#ffca3a" emissiveIntensity={1.6} />
          </mesh>
        </group>
      ))}
    </InteriorGroup>
  );
}

export function ShopInterior({ plot }: { plot: Plot }) {
  const w = plot.w - 0.7;
  const d = plot.d - 0.7;
  return (
    <InteriorGroup plot={plot}>
      <Slab w={w} d={d} color="#b5ab98" />
      <ShelfUnit x={-1.4} z={-0.6} />
      <ShelfUnit x={1.4} z={-0.6} goods={["#274b73", "#d9a62e", "#5b3a75"]} />
      <ShelfUnit x={0} z={-d / 2 + 0.9} goods={["#a83a32", "#eceae6", "#2e6b46"]} />
      <Counter x={-w / 2 + 1.3} z={d / 2 - 1.4} w={2.6} color="#274b73" />
      <mesh position={-w / 2 + 1.3} rotation={[0, 0, 0]}>
        <mesh position={[0, 1.35, 0]}>
          <boxGeometry args={[0.5, 0.35, 0.4]} />
          <meshStandardMaterial color="#141210" roughness={0.7} />
        </mesh>
      </mesh>
      {/* drinks fridge, humming with light */}
      <group position={[w / 2 - 0.6, 0, -d / 2 + 0.9]}>
        <mesh position={[0, 1.0, 0]} castShadow>
          <boxGeometry args={[1.0, 2.0, 0.8]} />
          <meshStandardMaterial color="#dfe5e8" roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.2, 0.42]}>
          <boxGeometry args={[0.8, 1.2, 0.04]} />
          <meshStandardMaterial color="#9fd8ff" emissive="#7cc4ff" emissiveIntensity={0.7} />
        </mesh>
      </group>
    </InteriorGroup>
  );
}

function Partition({ x, z, w, h = 2.7 }: { x: number; z: number; w: number; h?: number }) {
  return (
    <mesh position={[x, h / 2, z]} castShadow receiveShadow>
      <boxGeometry args={[w, h, 0.18]} />
      <meshStandardMaterial color="#ddd5c4" roughness={1} />
    </mesh>
  );
}

export function ApartmentInterior({ plot }: { plot: Plot }) {
  const w = plot.w - 0.7;
  const d = plot.d - 0.7;
  return (
    <InteriorGroup plot={plot}>
      <Slab w={w} d={d} color="#c4b49a" />
      {/* bedroom partition (right side) with a door gap */}
      <Partition x={1.5} z={-2.4} w={7.2} />
      <Partition x={4.45} z={2.6} w={3.1} />
      {/* living room: sofa + TV */}
      <group position={[-3.2, 0, 1.2]}>
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[2.4, 0.5, 0.95]} />
          <meshStandardMaterial color="#5b3a75" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.75, -0.42]}>
          <boxGeometry args={[2.4, 0.7, 0.2]} />
          <meshStandardMaterial color="#4a2f60" roughness={0.9} />
        </mesh>
      </group>
      <group position={[-3.2, 0, -1.3]}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.6, 0.5, 0.45]} />
          <meshStandardMaterial color="#3d3a45" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.0, -0.1]}>
          <boxGeometry args={[1.4, 0.8, 0.06]} />
          <meshStandardMaterial color="#101418" emissive="#223344" emissiveIntensity={0.5} />
        </mesh>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.2, 0.075, 0]}>
        <circleGeometry args={[1.5, 20]} />
        <meshStandardMaterial color="#a83a32" roughness={1} />
      </mesh>
      {/* kitchen corner */}
      <Counter x={-w / 2 + 1.6} z={-d / 2 + 1.1} w={3.2} color="#6f6a60" />
      {[-0.8, 0, 0.8].map((dx, i) => (
        <mesh key={i} position={[-w / 2 + 1.6 + dx, 1.3, -d / 2 + 1.1]}>
          <cylinderGeometry args={[0.16, 0.2, 0.22, 10]} />
          <meshStandardMaterial color={["#c0c4c7", "#274b73", "#c96a2c"][i]} roughness={0.5} metalness={0.4} />
        </mesh>
      ))}
      {/* bedroom: bed + wardrobe */}
      <group position={[3.9, 0, -3.4]}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[2.0, 0.35, 3.0]} />
          <meshStandardMaterial color="#5a3a24" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.52, 0]}>
          <boxGeometry args={[1.9, 0.22, 2.9]} />
          <meshStandardMaterial color="#eceae6" roughness={1} />
        </mesh>
        <mesh position={[0, 0.66, -1.1]}>
          <boxGeometry args={[1.2, 0.16, 0.5]} />
          <meshStandardMaterial color="#d9a62e" roughness={1} />
        </mesh>
      </group>
      <mesh position={[5.3, 1.0, -3.4]} castShadow>
        <boxGeometry args={[0.9, 2.0, 2.2]} />
        <meshStandardMaterial color="#4a3826" roughness={0.9} />
      </mesh>
      {/* bathroom door (visual) */}
      <mesh position={[-1.2, 1.05, -d / 2 + 0.12]}>
        <boxGeometry args={[1.0, 2.1, 0.08]} />
        <meshStandardMaterial color="#7a6a4a" roughness={0.9} />
      </mesh>
    </InteriorGroup>
  );
}

/** Interior furniture colliders + interactables (see interiorLayout — single source). */
export { interiorColliders as _interiorCollidersUnused } from "./interiorLayout";
