"use client";

import type { Box } from "@/lib/collision";
import Roads from "./yaba/Roads";
import Compound from "./yaba/Compound";
import ShopsRow from "./yaba/ShopsRow";
import Restaurant from "./yaba/Restaurant";
import BusStopSide from "./yaba/BusStopSide";

export type Interactable = { id: string; title: string; detail: string; x: number; z: number; radius: number };

export const ENTRY_SPAWN = { x: 0, z: 9, facing: Math.PI };
export const ENTRY_INTERACTABLES: Interactable[] = [
  { id: "mama-put", title: "Mama Put Spot", detail: "Hot jollof and peppered chicken. Taking orders in the next phase.", x: 9, z: -9, radius: 4.2 },
  { id: "corner-shop", title: "Corner Shop", detail: "Provisions, airtime, cold drinks. Stocking shelves in the next phase.", x: -9, z: -8.4, radius: 4.2 },
  { id: "bus-stop", title: "Yaba Bus Stop", detail: "Danfo to Oshodi loads here mornings. Routes open in the next phase.", x: -9, z: 9, radius: 4.0 },
];

export const ENTRY_COLLIDERS: Box[] = [
  { x: -14, z: -13, hx: 7.5, hz: 6 },
  { x: -9, z: -12.5, hx: 7.5, hz: 2.6 },
  { x: 9, z: -13, hx: 4.6, hz: 4.4 },
  { x: -13, z: 4.5, hx: 1.6, hz: 3.4 },
  { x: -3.4, z: -8.4, hx: 0.9, hz: 0.9 },
  { x: 4.6, z: 6.5, hx: 0.35, hz: 0.35 },
  { x: -4.6, z: 6.5, hx: 0.35, hz: 0.35 },
  { x: 4.6, z: -6.5, hx: 0.35, hz: 0.35 },
  { x: -4.6, z: -6.5, hx: 0.35, hz: 0.35 },
];

export default function YabaBlock() {
  return (
    <group>
      <Roads />
      <Compound />
      <ShopsRow />
      <Restaurant />
      <BusStopSide />
    </group>
  );
}
