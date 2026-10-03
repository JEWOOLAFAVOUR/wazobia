"use client";

import { Html } from "@react-three/drei";
import type { Building } from "@/lib/api";

const KIND_STYLE: Record<string, { color: string; h: number }> = {
  apartment: { color: "#8a8a8a", h: 5 },
  restaurant: { color: "#c2703d", h: 3.5 },
  shop: { color: "#7bc23d", h: 3.5 },
  bank: { color: "#3d7bc2", h: 6 },
  church: { color: "#e8e4d8", h: 5 },
  mosque: { color: "#4db6a3", h: 5 },
  club: { color: "#9b4de8", h: 4 },
  park: { color: "#2f7d3a", h: 1 },
};

function Trees() {
  const spots: [number, number][] = [
    [-8, 32], [0, 36], [8, 32], [-14, 26], [14, 26], [0, 27],
  ];
  return (
    <group>
      {spots.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[0.25, 0.3, 2, 6]} />
            <meshStandardMaterial color="#5b3a1e" />
          </mesh>
          <mesh position={[0, 3, 0]}>
            <sphereGeometry args={[1.4, 8, 8]} />
            <meshStandardMaterial color="#2f7d3a" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function StreetLights() {
  const spots: [number, number][] = [
    [-6, -20], [6, -20], [-6, 0], [6, 0], [-6, 20], [6, 20], [-20, -6], [20, 6],
  ];
  return (
    <group>
      {spots.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 3, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 6, 6]} />
            <meshStandardMaterial color="#444" />
          </mesh>
          <mesh position={[0, 6.1, 0]}>
            <sphereGeometry args={[0.35, 8, 8]} />
            <meshStandardMaterial color="#ffe9a3" emissive="#ffca3a" emissiveIntensity={1.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function YabaMap({ buildings }: { buildings: Building[] }) {
  return (
    <group>
      {/* base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#17251c" />
      </mesh>
      {/* zone tints: a=NW residential, b=NE commercial, c=SE market, d=SW parkside */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-30, 0, -30]}>
        <planeGeometry args={[58, 58]} />
        <meshStandardMaterial color="#243044" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[30, 0, -30]}>
        <planeGeometry args={[58, 58]} />
        <meshStandardMaterial color="#2e2b23" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[30, 0, 30]}>
        <planeGeometry args={[58, 58]} />
        <meshStandardMaterial color="#2c2318" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-30, 0, 30]}>
        <planeGeometry args={[58, 58]} />
        <meshStandardMaterial color="#1f2e22" />
      </mesh>
      {/* roads */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[8, 120]} />
        <meshStandardMaterial color="#33363b" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[120, 8]} />
        <meshStandardMaterial color="#33363b" />
      </mesh>
      {/* lane dashes */}
      {Array.from({ length: 11 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-25 + i * 5, 0.04, 0]}>
          <planeGeometry args={[1.6, 0.3]} />
          <meshStandardMaterial color="#d8c84a" />
        </mesh>
      ))}

      {buildings.map((b) => {
        const s = KIND_STYLE[b.kind] ?? { color: "#888", h: 4 };
        return (
          <group key={b.id} position={[b.x, 0, b.z]}>
            <mesh position={[0, s.h / 2, 0]}>
              <boxGeometry args={[6, s.h, 6]} />
              <meshStandardMaterial color={s.color} />
            </mesh>
            <mesh position={[0, s.h + 0.2, 0]}>
              <boxGeometry args={[6.4, 0.4, 6.4]} />
              <meshStandardMaterial color="#1c1c1e" />
            </mesh>
            {/* door */}
            <mesh position={[0, 1, 3.05]}>
              <boxGeometry args={[1.6, 2, 0.15]} />
              <meshStandardMaterial color={b.open ? "#ffe9a3" : "#552"} emissive={b.open ? "#ffca3a" : "#000"} emissiveIntensity={b.open ? 0.7 : 0} />
            </mesh>
            <Html position={[0, s.h + 1.6, 0]} center distanceFactor={40}>
              <div style={{ background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: 11, padding: "2px 8px", borderRadius: 8, whiteSpace: "nowrap" }}>
                {b.name}
              </div>
            </Html>
          </group>
        );
      })}
      <Trees />
      <StreetLights />
    </group>
  );
}
