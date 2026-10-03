"use client";

import { Html } from "@react-three/drei";
import { PLOTS } from "@/game/world/yaba/layout";

const ICON: Record<string, string> = {
  shop: "🏪",
  restaurant: "🍲",
  house: "🏠",
  apartment: "🏢",
  office: "🏢",
  bank: "🏦",
  church: "⛪",
  mosque: "🕌",
  club: "🎵",
};

/** Floating venue chips so the neighbourhood reads at a glance. Pointer-transparent so orbit/clicks pass through. */
export default function VenueLabels() {
  return (
    <group>
      {PLOTS.map((p) => (
        <group key={p.id} position={[p.x, (p.enterable ? 3.6 : p.height) + 1.4, p.z]}>
          <Html center distanceFactor={55} occlude="blending" wrapperClass="venue-label" style={{ pointerEvents: "none" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.94)",
                borderRadius: 999,
                padding: "3px 10px",
                fontSize: 12,
                fontWeight: 600,
                color: "#1e293b",
                whiteSpace: "nowrap",
                boxShadow: "0 4px 14px rgba(15,23,42,0.18)",
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              {ICON[p.kind] ?? "📍"} {p.name}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}
