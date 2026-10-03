"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, MapControls } from "@react-three/drei";
import * as THREE from "three";
import { PLOTS, ROADS, type RoadSpec } from "@/game/world/yaba/layout";
import { Danfo } from "@/game/world/yaba/parts";

const CITY_BOUNDS = { minX: -266, maxX: 480, minZ: -141, maxZ: 340 };
const CITY_CAMERA_DIRECTION = new THREE.Vector3(0.55, 0.65, 0.55).normalize();
const CITY_CENTER = {
  x: (CITY_BOUNDS.minX + CITY_BOUNDS.maxX) / 2,
  z: (CITY_BOUNDS.minZ + CITY_BOUNDS.maxZ) / 2,
};

function cityOverviewDistance(camera: THREE.Camera, width: number, height: number) {
  const perspectiveCamera = camera as THREE.PerspectiveCamera;
  const halfFov = THREE.MathUtils.degToRad(perspectiveCamera.fov) / 2;
  const aspect = width / Math.max(1, height);
  const diagonalSpan =
    (CITY_BOUNDS.maxX - CITY_BOUNDS.minX + CITY_BOUNDS.maxZ - CITY_BOUNDS.minZ) / Math.sqrt(2);
  const verticalSpan = diagonalSpan * Math.cos(Math.atan2(0.65, Math.sqrt(2) * 0.55));
  return Math.max(
    diagonalSpan / (2 * Math.tan(halfFov) * aspect),
    verticalSpan / (2 * Math.tan(halfFov)),
  ) * 0.65;
}

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
export function MapCamera() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controls = useRef<any>(null);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const maxDistance = useMemo(() => cityOverviewDistance(camera, size.width, size.height), [camera, size.width, size.height]);

  useLayoutEffect(() => {
    const target = new THREE.Vector3(CITY_CENTER.x, 0, CITY_CENTER.z);
    camera.position.copy(target).addScaledVector(CITY_CAMERA_DIRECTION, maxDistance);
    camera.lookAt(target);
    controls.current?.target.copy(target);
    controls.current?.update();
  }, [camera, maxDistance]);

  return (
    <MapControls
      ref={controls}
      makeDefault
      enableRotate={false}
      enableDamping
      dampingFactor={0.12}
      screenSpacePanning={false}
      minDistance={35}
      maxDistance={maxDistance}
      maxPolarAngle={Math.PI / 3.2}
      mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
      touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN }}
    />
  );
}

type House = { x: number; z: number; rot: number; c: string; roof: string; w: number; d: number; h: number };

const HOUSE_COLORS = ["#e4d1b2", "#e8c9a9", "#d7d0bf", "#d6bd91", "#deb9a0"];
const ROOF_COLORS = ["#a95136", "#75483a", "#4b4b48", "#9a7145", "#59634b"];

const CITY_ROADS: RoadSpec[] = [
  { id: "expressway", axis: "x", center: -108, width: 12, from: -150, to: 150, main: true },
  { id: "north-ring", axis: "x", center: -74, width: 7, from: -150, to: 150, main: false },
  { id: "south-link", axis: "x", center: 48, width: 9, from: -150, to: 150, main: true },
  { id: "mainland-west", axis: "z", center: -125, width: 8, from: -135, to: 52, main: true },
  { id: "mainland-inner-west", axis: "z", center: -90, width: 5, from: -135, to: 52, main: false },
  { id: "mainland-east", axis: "z", center: 92, width: 6, from: -135, to: 52, main: false },
  { id: "mainland-far-east", axis: "z", center: 132, width: 8, from: -135, to: 52, main: true },
  { id: "vi-west", axis: "z", center: -68, width: 6, from: 82, to: 142, main: false },
  { id: "vi-centre-west", axis: "z", center: -28, width: 5, from: 82, to: 142, main: false },
  { id: "vi-centre-east", axis: "z", center: 22, width: 6, from: 82, to: 142, main: false },
  { id: "vi-east", axis: "z", center: 62, width: 7, from: 82, to: 142, main: true },
  { id: "vi-north", axis: "x", center: 88, width: 7, from: -92, to: 66, main: false },
  { id: "vi-middle", axis: "x", center: 112, width: 6, from: -92, to: 66, main: false },
  { id: "vi-south", axis: "x", center: 138, width: 8, from: -92, to: 66, main: true },
  { id: "lekki-west", axis: "z", center: 92, width: 10, from: 80, to: 174, main: true },
  { id: "lekki-middle", axis: "z", center: 132, width: 5, from: 76, to: 200, main: false },
  { id: "lekki-east", axis: "z", center: 174, width: 7, from: 88, to: 212, main: true },
  { id: "lekki-coastal-link", axis: "z", center: 238, width: 8, from: 92, to: 215, main: true },
  { id: "lekki-north", axis: "x", center: 88, width: 6, from: 80, to: 192, main: false },
  { id: "lekki-centre", axis: "x", center: 132, width: 9, from: 68, to: 282, main: true },
  { id: "mainland-local-north", axis: "x", center: -43, width: 3.2, from: -150, to: 150, main: false },
  { id: "mainland-local-mid", axis: "x", center: -20, width: 3.2, from: -150, to: 150, main: false },
  { id: "mainland-local-south", axis: "x", center: 20, width: 3.2, from: -150, to: 150, main: false },
  { id: "mainland-local-west", axis: "z", center: -43, width: 3.2, from: -135, to: 52, main: false },
  { id: "mainland-local-east", axis: "z", center: 16, width: 3.2, from: -135, to: 52, main: false },
  { id: "island-local-north", axis: "x", center: 99, width: 3.2, from: -96, to: 68, main: false },
  { id: "island-local-south", axis: "x", center: 126, width: 3.2, from: -96, to: 68, main: false },
  { id: "island-local-west", axis: "z", center: -48, width: 3.2, from: 82, to: 142, main: false },
  { id: "island-local-east", axis: "z", center: 44, width: 3.2, from: 82, to: 142, main: false },
  { id: "apapa-port-road", axis: "x", center: -60, width: 10, from: -265, to: -150, main: true },
  { id: "apapa-dock-road", axis: "x", center: -5, width: 6, from: -255, to: -175, main: false },
  { id: "apapa-west-link", axis: "z", center: -254, width: 7, from: -72, to: 35, main: true },
  { id: "apapa-east-link", axis: "z", center: -190, width: 5, from: -78, to: 34, main: false },
  { id: "ajah-epe-expressway", axis: "x", center: 174, width: 12, from: 90, to: 470, main: true },
  { id: "ajah-local-north", axis: "x", center: 150, width: 4, from: 270, to: 338, main: false },
  { id: "ajah-local-south", axis: "x", center: 211, width: 4, from: 270, to: 360, main: false },
  { id: "ajah-west", axis: "z", center: 282, width: 6, from: 130, to: 254, main: false },
  { id: "ajah-centre", axis: "z", center: 322, width: 8, from: 141, to: 254, main: true },
  { id: "ajah-east", axis: "z", center: 360, width: 5, from: 192, to: 262, main: false },
  { id: "ibeju-spine", axis: "x", center: 236, width: 9, from: 340, to: 470, main: true },
  { id: "ibeju-local", axis: "x", center: 205, width: 4, from: 358, to: 380, main: false },
  { id: "ibeju-harbor-link", axis: "z", center: 449, width: 7, from: 176, to: 250, main: true },
  { id: "fertilizer-gate", axis: "x", center: 213, width: 5, from: 346, to: 360, main: false },
  { id: "steel-gate", axis: "x", center: 258, width: 5, from: 356, to: 372, main: false },
];

function landGeometry(points: [number, number][]): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  points.forEach(([x, z], index) => {
    if (index === 0) shape.moveTo(x, -z);
    else shape.lineTo(x, -z);
  });
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

const MAINLAND_GEOMETRY = landGeometry([
  [-160, -120], [-145, -138], [-70, -141], [10, -137], [90, -141], [150, -127],
  [157, -100], [148, -77], [158, -49], [150, -18], [157, 8], [144, 38], [125, 55],
  [72, 59], [8, 53], [-66, 60], [-132, 53], [-157, 36], [-150, 8], [-160, -24], [-149, -60], [-158, -91],
]);
const APAPA_GEOMETRY = landGeometry([
  [-176, -80], [-205, -85], [-240, -64], [-263, -32], [-266, 4],
  [-253, 28], [-230, 43], [-202, 47], [-177, 36],
]);
const ISLAND_GEOMETRY = landGeometry([
  [-113, 81], [-105, 94], [-108, 119], [-99, 145], [-80, 164], [-51, 170], [-28, 160],
  [4, 170], [35, 160], [59, 158], [79, 141], [75, 105], [61, 88], [39, 80], [2, 76], [-38, 79], [-76, 76],
]);
const EKO_GEOMETRY = landGeometry([
  [-158, 84], [-121, 87], [-113, 102], [-113, 127], [-121, 146], [-137, 158], [-160, 146], [-166, 121],
]);
const LEKKI_GEOMETRY = landGeometry([
  [80, 78], [92, 81], [112, 72], [140, 78], [163, 88], [190, 87],
  [225, 90], [252, 105], [270, 126], [303, 130], [329, 145], [350, 166],
  [364, 192], [370, 219], [359, 245], [339, 263], [310, 270], [282, 253],
  [270, 218], [250, 218], [221, 222], [196, 218], [170, 210], [140, 202], [110, 190],
  [91, 174], [84, 151], [81, 125], [79, 108],
]);
// Ibeju-Lekki industrial mainland: refinery, port and factory belt east of
// Sangotedo. Overlaps Lekki slightly and sits 5mm lower to avoid shimmer.
const IBEJU_GEOMETRY = landGeometry([
  [340, 158], [380, 152], [420, 150], [455, 152], [478, 160],
  [482, 190], [480, 230], [478, 260], [478, 288],
  [454, 282], [450, 280], [414, 280], [410, 282], [380, 286], [355, 288],
  [348, 240], [344, 200], [340, 170],
]);

function RoadStrip({ road, elevation = 0.18 }: { road: RoadSpec; elevation?: number }) {
  const alongX = road.axis === "x";
  const length = road.to - road.from;
  const middle = (road.from + road.to) / 2;
  const at = (offset: number): [number, number, number] =>
    alongX
      ? [middle, elevation, road.center + offset]
        : [road.center + offset, elevation, middle];
  const size = (width: number): [number, number] =>
    alongX ? [length, width] : [width, length];
  const dashCount = road.main ? Math.floor(length / 14) : 0;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={alongX ? [middle, elevation, road.center] : [road.center, elevation, middle]}>
        <planeGeometry args={size(road.width)} />
        <meshStandardMaterial color={road.main ? "#4b4a47" : "#625e54"} roughness={1} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          rotation={[-Math.PI / 2, 0, 0]}
          position={at(side * (road.width / 2 + 0.9))}
        >
          <planeGeometry args={size(1.2)} />
          <meshStandardMaterial color="#aaa18e" roughness={1} />
        </mesh>
      ))}
      {Array.from({ length: dashCount }, (_, i) => {
        const distance = road.from + 5 + i * 14;
        return (
          <mesh
            key={i}
            rotation={[-Math.PI / 2, 0, 0]}
            position={alongX ? [distance, elevation + 0.02, road.center] : [road.center, elevation + 0.02, distance]}
          >
            <planeGeometry args={alongX ? [4, 0.28] : [0.28, 4]} />
            <meshStandardMaterial color="#e2c967" roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}

type LandmarkKind = "dining" | "office" | "hub" | "nightlife" | "beach" | "event" | "culture" | "nature" | "education" | "retail" | "industrial" | "radio";
type Landmark = {
  name: string;
  district: string;
  category: string;
  kind: LandmarkKind;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  accent: string;
  featured?: boolean;
};

const LANDMARKS: Landmark[] = [
  { name: "Korede Spaghetti", district: "Surulere", category: "Street food", kind: "dining", x: -126, z: -28, w: 17, d: 15, h: 6, color: "#e6c092", accent: "#c83d2b" },
  { name: "Korede Spaghetti", district: "Yaba", category: "Restaurant", kind: "dining", x: 41, z: 28, w: 17, d: 15, h: 6, color: "#e8cf9f", accent: "#d54c32" },
  { name: "CcHUB", district: "Yaba", category: "Innovation campus", kind: "hub", x: -38, z: 28, w: 22, d: 19, h: 12, color: "#d7e4e2", accent: "#f07832", featured: true },
  { name: "UNILAG", district: "Akoka", category: "University", kind: "education", x: -86, z: -110, w: 28, d: 22, h: 15, color: "#dfd4b9", accent: "#3d8062" },
  { name: "New Afrika Shrine", district: "Ikeja", category: "Live music", kind: "culture", x: -12, z: -119, w: 24, d: 19, h: 9, color: "#c99b64", accent: "#d43e2e", featured: true },
  { name: "Wazobia FM Lagos", district: "Ikeja", category: "Radio station", kind: "radio", x: 51, z: -116, w: 25, d: 20, h: 14, color: "#d7d2bd", accent: "#cf4939", featured: true },
  { name: "Balmoral Convention Centre", district: "Ikeja", category: "Events", kind: "event", x: 124, z: -108, w: 30, d: 23, h: 10, color: "#d5d7cf", accent: "#b48c52" },
  { name: "Freedom Park", district: "Lagos Island", category: "Culture & live music", kind: "culture", x: -93, z: 111, w: 20, d: 18, h: 7, color: "#c4aa81", accent: "#4b7950", featured: true },
  { name: "RSVP Lagos", district: "Victoria Island", category: "Fine dining", kind: "dining", x: -70, z: 98, w: 20, d: 17, h: 7, color: "#e9d9bf", accent: "#8c342d" },
  { name: "The Yellow Chilli", district: "Victoria Island", category: "Nigerian dining", kind: "dining", x: -26, z: 98, w: 20, d: 17, h: 7, color: "#e1c391", accent: "#d47b29" },
  { name: "Cactus Restaurant", district: "Victoria Island", category: "Restaurant & bakery", kind: "dining", x: 18, z: 98, w: 20, d: 17, h: 7, color: "#d5ddce", accent: "#56845d" },
  { name: "Club Illusion", district: "Victoria Island", category: "Afrobeats club", kind: "nightlife", x: -70, z: 130, w: 20, d: 18, h: 10, color: "#353443", accent: "#ae51d8" },
  { name: "Sky Bar MKT", district: "Victoria Island", category: "Rooftop lounge", kind: "nightlife", x: -26, z: 130, w: 20, d: 18, h: 12, color: "#424047", accent: "#f5b34f" },
  { name: "Shades Social", district: "Victoria Island", category: "Bar & live music", kind: "nightlife", x: 18, z: 130, w: 20, d: 18, h: 9, color: "#514642", accent: "#df654d" },
  { name: "Quilox", district: "Victoria Island", category: "Superclub", kind: "nightlife", x: 62, z: 98, w: 22, d: 19, h: 13, color: "#342c3c", accent: "#d13e87" },
  { name: "Vaniti Lagos", district: "Victoria Island", category: "VIP nightlife", kind: "nightlife", x: 62, z: 130, w: 21, d: 18, h: 11, color: "#393541", accent: "#c8a1e0" },
  { name: "Cubana", district: "Victoria Island", category: "Lounge & club", kind: "nightlife", x: 100, z: 130, w: 20, d: 18, h: 10, color: "#544239", accent: "#e0a13a" },
  { name: "Eko Convention Centre", district: "Victoria Island", category: "Concerts & events", kind: "event", x: -91, z: 155, w: 30, d: 22, h: 11, color: "#d8d2c3", accent: "#b78749", featured: true },
  { name: "The Civic Centre", district: "Victoria Island", category: "Waterfront events", kind: "event", x: 81, z: 157, w: 27, d: 20, h: 10, color: "#d6dedc", accent: "#4f9a9e" },
  { name: "Terra Kulture", district: "Victoria Island", category: "Arts & theatre", kind: "culture", x: -126, z: 119, w: 20, d: 17, h: 8, color: "#d4bc91", accent: "#b74935" },
  { name: "Landmark Beach", district: "Oniru", category: "Beach & events", kind: "beach", x: 111, z: 108, w: 25, d: 20, h: 6, color: "#e2ca93", accent: "#318eae" },
  { name: "Hard Rock Cafe", district: "Oniru", category: "Restaurant & live music", kind: "dining", x: 146, z: 108, w: 22, d: 18, h: 8, color: "#d5c2a3", accent: "#c3372f" },
  { name: "Landmark Event Centre", district: "Oniru", category: "Exhibitions & festivals", kind: "event", x: 182, z: 108, w: 29, d: 22, h: 10, color: "#d6d8d2", accent: "#d7a13d", featured: true },
  { name: "Moist Beach Club", district: "Oniru", category: "Beach club", kind: "beach", x: 111, z: 153, w: 24, d: 19, h: 7, color: "#d9bd8b", accent: "#de6048" },
  { name: "Sailor's Lounge", district: "Lekki Phase 1", category: "Waterfront lounge", kind: "beach", x: 148, z: 153, w: 23, d: 18, h: 7, color: "#d4c092", accent: "#3c8b9d" },
  { name: "Bay Lounge / W Bar", district: "Lekki Phase 1", category: "Lagoon-view lounge", kind: "nightlife", x: 184, z: 153, w: 21, d: 18, h: 8, color: "#454049", accent: "#61a6cb" },
  { name: "Elegushi Beach", district: "Lekki", category: "Beach & nightlife", kind: "beach", x: 111, z: 198, w: 27, d: 21, h: 6, color: "#e0c88e", accent: "#e27645" },
  { name: "Monarch Event Centre", district: "Lekki", category: "Events", kind: "event", x: 148, z: 198, w: 27, d: 21, h: 10, color: "#d9d2c3", accent: "#c39a62" },
  { name: "Upbeat Recreation Centre", district: "Lekki", category: "Games & recreation", kind: "retail", x: 184, z: 198, w: 24, d: 21, h: 9, color: "#d8d3c4", accent: "#56a9bd" },
  { name: "Lekki Conservation Centre", district: "Lekki", category: "Nature & canopy walk", kind: "nature", x: 220, z: 180, w: 24, d: 22, h: 7, color: "#b8c69b", accent: "#3e8055", featured: true },
  { name: "The Palms Mall", district: "Lekki", category: "Shopping & cinema", kind: "retail", x: 220, z: 153, w: 30, d: 22, h: 12, color: "#cfd5d2", accent: "#5597aa" },
  { name: "Tarkwa Bay", district: "Lagos Coast", category: "Island beach", kind: "beach", x: -164, z: 190, w: 21, d: 17, h: 5, color: "#e4cf9e", accent: "#347fa0" },
  { name: "Apapa Port Complex", district: "Apapa", category: "Cargo & shipping", kind: "industrial", x: -219, z: -30, w: 35, d: 27, h: 11, color: "#aeb3ab", accent: "#df9c35", featured: true },
  { name: "Tin Can Island Port", district: "Apapa", category: "Container terminal", kind: "industrial", x: -222, z: 14, w: 31, d: 24, h: 9, color: "#b7b6aa", accent: "#d34c37" },
  { name: "GTCO Place", district: "Ajah", category: "Corporate headquarters", kind: "office", x: 286, z: 137, w: 21, d: 14, h: 31, color: "#d5dad9", accent: "#dd5c3d", featured: true },
  { name: "FirstBank Business Centre", district: "Ajah", category: "Corporate offices", kind: "office", x: 350, z: 126, w: 18, d: 14, h: 26, color: "#c9d2d8", accent: "#3978ad" },
  { name: "Novare Lekki Mall", district: "Sangotedo", category: "Shopping & cinema", kind: "retail", x: 292, z: 190, w: 29, d: 22, h: 11, color: "#d5d8d3", accent: "#4c92a4", featured: true },
  { name: "Pan-Atlantic University", district: "Ibeju-Lekki", category: "University campus", kind: "education", x: 350, z: 194, w: 25, d: 21, h: 13, color: "#ddd3b7", accent: "#48805b" },
  { name: "Lekki Free Trade Zone", district: "Ibeju-Lekki", category: "Industry & logistics", kind: "industrial", x: 343, z: 235, w: 25, d: 25, h: 10, color: "#b4b5ad", accent: "#db9d3c" },
  { name: "Victoria Garden City", district: "Ajah", category: "Gated residential estate", kind: "retail", x: 298, z: 234, w: 18, d: 14, h: 8, color: "#d6d0bd", accent: "#568451" },
  { name: "Sangotedo Business Park", district: "Sangotedo", category: "Commercial offices", kind: "office", x: 350, z: 158, w: 24, d: 12, h: 24, color: "#c8d3d2", accent: "#5f9ea0" },
  { name: "Eko Pearl Towers", district: "Eko Atlantic", category: "Residential high-rise", kind: "office", x: -139, z: 124, w: 21, d: 20, h: 42, color: "#cbd7d8", accent: "#4a9ba6", featured: true },
  { name: "Dangote Refinery", district: "Ibeju-Lekki", category: "Refinery under construction", kind: "industrial", x: 430, z: 188, w: 20, d: 14, h: 10, color: "#b9b3a6", accent: "#db9d3c", featured: true },
  { name: "Fertiliser Plant", district: "Ibeju-Lekki", category: "Granulation & blending", kind: "industrial", x: 374, z: 194, w: 20, d: 18, h: 12, color: "#c0bcb0", accent: "#4f9a5b" },
  { name: "Steel & Pipe Mill", district: "Ibeju-Lekki", category: "Steel rolling & pipe", kind: "industrial", x: 346, z: 258, w: 20, d: 18, h: 11, color: "#adafa8", accent: "#b74c35" },
  { name: "FTZ Logistics Warehouses", district: "Ibeju-Lekki", category: "Warehousing & distribution", kind: "industrial", x: 408, z: 250, w: 28, d: 20, h: 9, color: "#c4c2b8", accent: "#376c79" },
  { name: "Lekki Deep Sea Port", district: "Ibeju-Lekki", category: "Container terminal & quay", kind: "industrial", x: 450, z: 270, w: 36, d: 22, h: 10, color: "#aeb3ab", accent: "#df9c35", featured: true },
  { name: "Quarry & Concrete Works", district: "Ibeju-Lekki", category: "Aggregate & batching", kind: "industrial", x: 455, z: 220, w: 22, d: 18, h: 8, color: "#b0a898", accent: "#7a6a55" },
  { name: "Truck Park Terminal", district: "Ibeju-Lekki", category: "Haulage & staging", kind: "industrial", x: 400, z: 282, w: 26, d: 12, h: 6, color: "#bab5a6", accent: "#d34c37" },
];

const LABEL_OFFSETS: [number, number][] = [[0, 0]];
for (let radius = 14; radius <= 360; radius += 14) {
  for (let step = 0; step < 16; step++) {
    const angle = (step / 16) * Math.PI * 2;
    LABEL_OFFSETS.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
  }
}

type LabelRefs = React.MutableRefObject<(HTMLDivElement | null)[]>;
type LeaderRefs = React.MutableRefObject<(HTMLSpanElement | null)[]>;

function registerNode<T extends HTMLElement>(refs: React.MutableRefObject<(T | null)[]>, index: number, node: T | null) {
  refs.current[index] = node;
}

function LandmarkLabelLayout({ labels, leaders, active }: { labels: LabelRefs; leaders: LeaderRefs; active: boolean }) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const points = useMemo(
    () => LANDMARKS.map((place) => new THREE.Vector3(place.x, place.h + 2.65, place.z)),
    [],
  );
  const projected = useMemo(() => points.map(() => new THREE.Vector3()), [points]);
  const lastCamera = useRef({
    x: Infinity,
    y: Infinity,
    z: Infinity,
    qx: Infinity,
    qy: Infinity,
    qz: Infinity,
    qw: Infinity,
    width: 0,
    height: 0,
  });

  useFrame(() => {
    if (!active) return;
    if (labels.current.length < LANDMARKS.length || labels.current.some((label, index) => !label || !leaders.current[index])) {
      return;
    }
    const previous = lastCamera.current;
    if (
      Math.abs(camera.position.x - previous.x) < 0.02 &&
      Math.abs(camera.position.y - previous.y) < 0.02 &&
      Math.abs(camera.position.z - previous.z) < 0.02 &&
      Math.abs(camera.quaternion.x - previous.qx) < 0.0001 &&
      Math.abs(camera.quaternion.y - previous.qy) < 0.0001 &&
      Math.abs(camera.quaternion.z - previous.qz) < 0.0001 &&
      Math.abs(camera.quaternion.w - previous.qw) < 0.0001 &&
      previous.width === size.width &&
      previous.height === size.height
    ) {
      return;
    }
    Object.assign(previous, {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
      qx: camera.quaternion.x,
      qy: camera.quaternion.y,
      qz: camera.quaternion.z,
      qw: camera.quaternion.w,
      width: size.width,
      height: size.height,
    });

    const occupied: { left: number; right: number; top: number; bottom: number }[] = [];
    LANDMARKS.forEach((place, index) => {
      const label = labels.current[index];
      const leader = leaders.current[index];
      if (!label || !leader) return;
      const point = projected[index].copy(points[index]).project(camera);
      if (point.z < -1 || point.z > 1 || Math.abs(point.x) > 1.3 || Math.abs(point.y) > 1.3) {
        label.style.visibility = "hidden";
        leader.style.visibility = "hidden";
        return;
      }

      const anchorX = (point.x * 0.5 + 0.5) * size.width;
      const anchorY = (-point.y * 0.5 + 0.5) * size.height;
      const width = Math.max(22, label.offsetWidth);
      const height = Math.max(10, label.offsetHeight);
      let chosenX = 0;
      let chosenY = 0;
      let hasSlot = false;
      for (const [offsetX, offsetY] of LABEL_OFFSETS) {
        const left = anchorX + offsetX - width / 2;
        const right = left + width;
        const top = anchorY + offsetY - height / 2;
        const bottom = top + height;
        if (left < 4 || right > size.width - 4 || top < 4 || bottom > size.height - 4) continue;
        const collides = occupied.some(
          (box) => left < box.right + 2 && right > box.left - 2 && top < box.bottom + 2 && bottom > box.top - 2,
        );
        if (!collides) {
          chosenX = offsetX;
          chosenY = offsetY;
          occupied.push({ left, right, top, bottom });
          hasSlot = true;
          break;
        }
      }
      label.style.visibility = "visible";
      label.style.transform = `translate(calc(-50% + ${chosenX}px), calc(-50% + ${chosenY}px))`;
      const length = Math.hypot(chosenX, chosenY);
      leader.style.visibility = length > 5 ? "visible" : "hidden";
      leader.style.left = `calc(50% - ${chosenX}px)`;
      leader.style.top = `calc(50% - ${chosenY}px)`;
      leader.style.width = `${length}px`;
      leader.style.transform = `rotate(${Math.atan2(chosenY, chosenX)}rad)`;
      if (!hasSlot) {
        occupied.push({
          left: anchorX + chosenX - width / 2,
          right: anchorX + chosenX + width / 2,
          top: anchorY + chosenY - height / 2,
          bottom: anchorY + chosenY + height / 2,
        });
      }
    });
  });

  return null;
}

function houseGrid(x0: number, z0: number, cols: number, rows: number, dx: number, dz: number, seed: number): House[] {
  const houses: House[] = [];
  const houseSpacingX = dx * 1.15;
  const houseSpacingZ = dz * 1.15;
  for (let ix = 0; ix < cols; ix++) {
    for (let iz = 0; iz < rows; iz++) {
      const n = ix * 7 + iz * 11 + seed;
      if (n % 7 === 0) continue;
      houses.push({
        x: x0 + ix * houseSpacingX + (iz % 2) * 0.8,
        z: z0 + iz * houseSpacingZ,
        rot: (n % 5 === 0 ? 0.025 : 0) * (n % 2 === 0 ? 1 : -1),
        c: HOUSE_COLORS[n % HOUSE_COLORS.length],
        roof: ROOF_COLORS[(n + 2) % ROOF_COLORS.length],
        w: 2.7 + (n % 3) * 0.22,
        d: 3.1 + (n % 2) * 0.35,
        h: 1.9 + (n % 4) * 0.12,
      });
    }
  }
  return houses;
}

function buildEstates(): { mainland: House[]; island: House[]; lekki: House[]; ajah: House[]; ibeju: House[] } {
  return {
    mainland: [
      ...houseGrid(-143, -123, 7, 3, 6.5, 7.2, 1),
      ...houseGrid(-88, -122, 7, 3, 6.5, 7.2, 4),
      ...houseGrid(64, -122, 11, 3, 6.5, 7.2, 8),
      ...houseGrid(-143, -82, 7, 3, 6.5, 7.2, 12),
      ...houseGrid(-40, -48, 4, 2, 7, 7, 60),
      ...houseGrid(12, -48, 4, 2, 7, 7, 64),
      ...houseGrid(-43, -96, 3, 2, 7.4, 7.5, 48),
      ...houseGrid(22, -96, 3, 2, 7.4, 7.5, 52),
      ...houseGrid(64, -82, 11, 3, 6.5, 7.2, 16),
      ...houseGrid(-143, -49, 7, 3, 6.5, 7.2, 20),
      ...houseGrid(64, -49, 11, 3, 6.5, 7.2, 24),
      ...houseGrid(-143, 12, 7, 4, 6.5, 7.2, 28),
      ...houseGrid(-43, 22, 4, 2, 7.4, 7.5, 56),
      ...houseGrid(-40, 26, 4, 2, 7, 7, 68),
      ...houseGrid(64, 12, 11, 4, 6.5, 7.2, 32),
    ],
    island: [
      ...houseGrid(-94, 91, 6, 5, 6.4, 7.2, 36),
      ...houseGrid(-24, 91, 7, 5, 6.4, 7.2, 40),
      ...houseGrid(-94, 132, 6, 3, 6.4, 7.2, 44),
    ],
    lekki: houseGrid(88, 92, 13, 7, 6.7, 7.3, 48),
    ajah: houseGrid(248, 239, 7, 2, 6.6, 7.2, 76),
    // workers' housing spilling east toward the industrial belt
    ibeju: [
      ...houseGrid(296, 210, 3, 2, 6.6, 7.2, 80),
      ...houseGrid(296, 232, 3, 2, 6.6, 7.2, 84),
      // construction workers' camp beside the refinery zone
      ...houseGrid(454, 216, 3, 2, 6.6, 7.2, 88),
    ],
  };
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
      dummy.position.set(h.x, y + h.h / 2, h.z);
      dummy.rotation.set(0, h.rot, 0);
      dummy.scale.set(h.w / 2.3, h.h / 1.4, h.d / 2.7);
      dummy.updateMatrix();
      b.setMatrixAt(i, dummy.matrix);
      b.setColorAt(i, colors[i]);
      dummy.position.set(h.x, y + h.h + 0.16, h.z);
      dummy.rotation.set(0, h.rot, 0);
      dummy.scale.set((h.w + 0.55) / 2.6, 1, (h.d + 0.55) / 3);
      dummy.updateMatrix();
      r.setMatrixAt(i, dummy.matrix);
      r.setColorAt(i, new THREE.Color(h.roof));
    });
    b.instanceMatrix.needsUpdate = true;
    r.instanceMatrix.needsUpdate = true;
    if (b.instanceColor) b.instanceColor.needsUpdate = true;
    if (r.instanceColor) r.instanceColor.needsUpdate = true;
  }, [houses, colors, dummy, y]);

  return (
    <group>
      <instancedMesh ref={bodies} args={[undefined, undefined, houses.length]} frustumCulled={false}>
        <boxGeometry args={[2.3, 1.4, 2.7]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
      <instancedMesh ref={roofs} args={[undefined, undefined, houses.length]} frustumCulled={false}>
        <boxGeometry args={[2.6, 0.3, 3.0]} />
        <meshStandardMaterial color="#ffffff" roughness={1} />
      </instancedMesh>
    </group>
  );
}

function Bridge({ x }: { x: number }) {
  return (
    <group position={[x, 0, 64]}>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[11, 0.6, 38]} />
        <meshStandardMaterial color="#55524d" roughness={1} />
      </mesh>
      <mesh position={[0, 0.52, 0]}>
        <boxGeometry args={[0.35, 0.05, 35]} />
        <meshStandardMaterial color="#e4c96c" roughness={1} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 5.8, 0.7, 0]}>
          <mesh>
            <boxGeometry args={[0.28, 0.65, 38]} />
            <meshStandardMaterial color="#d5c4a1" roughness={1} />
          </mesh>
          {[-14, -7, 0, 7, 14].map((z) => (
            <mesh key={z} position={[0, -0.08, z]}>
              <boxGeometry args={[0.4, 0.4, 0.25]} />
              <meshStandardMaterial color="#a99d88" roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
      {[-12, 0, 12].map((z) => (
        <mesh key={z} position={[0, -1.4, z]}>
          <boxGeometry args={[12, 2.8, 1.4]} />
          <meshStandardMaterial color="#8b9385" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function CompoundWall({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  const wall = "#d9c9a8";
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.52, -d / 2]}>
        <boxGeometry args={[w, 1.04, 0.42]} />
        <meshStandardMaterial color={wall} roughness={1} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (w / 2), 0.52, 0]}>
          <boxGeometry args={[0.42, 1.04, d]} />
          <meshStandardMaterial color={wall} roughness={1} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (w / 4 + 0.75), 0.52, d / 2]}>
          <mesh>
            <boxGeometry args={[w / 2 - 1.5, 1.04, 0.42]} />
            <meshStandardMaterial color={wall} roughness={1} />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 1.5, 0.75, d / 2]}>
          <boxGeometry args={[0.4, 1.5, 0.55]} />
          <meshStandardMaterial color="#bd985f" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function LandmarkBuilding({
  place,
  index,
  labelRefs,
  leaderRefs,
  labelsVisible,
}: {
  place: Landmark;
  index: number;
  labelRefs: LabelRefs;
  leaderRefs: LeaderRefs;
  labelsVisible: boolean;
}) {
  const columns = Math.max(3, Math.floor(place.w / 4));
  const floors = Math.max(1, Math.floor((place.h - 1) / 2.8));
  const glass = place.kind === "nightlife" ? "#443c54" : "#52747a";
  const isPavilion = place.kind === "beach";
  const isGlass = place.kind === "office" || place.kind === "hub" || place.kind === "event" || place.kind === "retail";
  const isWideVenue = place.kind === "event" || place.kind === "industrial" || place.kind === "retail";

  return (
    <group position={[place.x, 0, place.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
        <planeGeometry args={[place.w + 6, place.d + 6]} />
        <meshStandardMaterial color={place.kind === "beach" ? "#d9c28e" : "#aaa69a"} roughness={1} />
      </mesh>
      <mesh position={[0, place.h / 2 + 0.35, 0]} castShadow>
        <boxGeometry args={[place.w, place.h, place.d]} />
        <meshStandardMaterial color={place.color} roughness={0.86} metalness={isGlass ? 0.08 : 0} />
      </mesh>
      {Array.from({ length: floors }, (_, floor) =>
        Array.from({ length: columns }, (_, column) => {
          const x = -place.w / 2 + ((column + 1) * place.w) / (columns + 1);
          const y = 1.7 + floor * 2.55;
          return (
            <mesh key={`${floor}-${column}`} position={[x, y, place.d / 2 + 0.07]}>
              <boxGeometry args={[Math.min(2.7, place.w / (columns + 1) * 0.55), 1.05, 0.1]} />
              <meshStandardMaterial color={glass} roughness={0.35} metalness={0.12} />
            </mesh>
          );
        }),
      )}
      <mesh position={[0, place.h + 0.48, 0]}>
        <boxGeometry args={[place.w + (isPavilion ? 4 : 1.5), 0.65, place.d + (isPavilion ? 4 : 1.5)]} />
        <meshStandardMaterial color={place.accent} roughness={0.82} />
      </mesh>
      <mesh position={[0, place.h + 1.65, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 1.7, 5]} />
        <meshBasicMaterial color={place.accent} />
      </mesh>
      <Html
        center
        position={[0, place.h + 2.65, 0]}
        wrapperClass="venue-label"
        style={{ pointerEvents: "none", visibility: labelsVisible ? "visible" : "hidden" }}
      >
        <div
          ref={(node) => {
            registerNode(labelRefs, index, node);
          }}
          style={{
            position: "relative",
            transform: "translate(-50%, -50%)",
            color: "#fffdf1",
            fontSize: 8,
            fontWeight: 800,
            lineHeight: "10px",
            letterSpacing: "0.01em",
            textAlign: "center",
            whiteSpace: "nowrap",
            textShadow: "0 1px 2px #26332b, 0 0 4px #26332b",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <span
            ref={(node) => {
              registerNode(leaderRefs, index, node);
            }}
            style={{
              position: "absolute",
              display: "block",
              left: "50%",
              top: "50%",
              height: 0,
              borderTop: `1px solid ${place.accent}`,
              transformOrigin: "left center",
              visibility: "hidden",
            }}
          />
          {place.name}
        </div>
      </Html>
      {place.kind === "office" && (
        <>
          <mesh position={[-place.w * 0.31, place.h * 0.56, 0]}>
            <boxGeometry args={[place.w * 0.16, place.h * 0.72, place.d * 0.88]} />
            <meshStandardMaterial color={place.color} roughness={0.55} metalness={0.16} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * place.w * 0.46, place.h * 0.49, place.d / 2 + 0.16]}>
              <boxGeometry args={[0.42, place.h * 0.86, 0.18]} />
              <meshStandardMaterial color={place.accent} roughness={0.65} metalness={0.1} />
            </mesh>
          ))}
          <mesh position={[0, place.h + 2.8, 0]}>
            <boxGeometry args={[place.w * 0.42, 4.6, place.d * 0.48]} />
            <meshStandardMaterial color={glass} roughness={0.3} metalness={0.2} />
          </mesh>
        </>
      )}
      {place.kind === "industrial" && (
        <>
          {Array.from({ length: 4 }, (_, index) => (
            <mesh
              key={index}
              position={[-place.w * 0.32 + index * 4.3, 1.1, -place.d / 2 - 2.5]}
            >
              <boxGeometry args={[3.8, 2.2, 4]} />
              <meshStandardMaterial color={index % 2 ? "#b74c35" : "#376c79"} roughness={0.88} />
            </mesh>
          ))}
          <mesh position={[0, place.h + 4, -place.d * 0.34]}>
            <boxGeometry args={[place.w * 0.82, 0.5, 0.55]} />
            <meshStandardMaterial color="#df9c35" roughness={0.8} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * place.w * 0.36, place.h / 2 + 2, -place.d * 0.34]}>
              <boxGeometry args={[0.5, place.h + 4, 0.55]} />
              <meshStandardMaterial color="#8a8172" roughness={0.9} />
            </mesh>
          ))}
        </>
      )}
      {place.kind === "radio" && (
        <group position={[0, place.h + 2.5, 0]}>
          <mesh>
            <cylinderGeometry args={[0.18, 0.35, 4.5, 8]} />
            <meshStandardMaterial color="#77766d" roughness={0.82} />
          </mesh>
          {[0, 1.8, -1.8].map((offset, index) => (
            <mesh key={index} position={[0, offset, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.07, 0.07, index === 0 ? 5 : 3.2, 6]} />
              <meshStandardMaterial color={place.accent} emissive={place.accent} emissiveIntensity={0.3} />
            </mesh>
          ))}
          <mesh position={[0, 2.4, 0]}>
            <sphereGeometry args={[0.22, 8, 6]} />
            <meshStandardMaterial color="#f2d265" emissive="#e9a934" emissiveIntensity={0.65} />
          </mesh>
        </group>
      )}
      {place.kind === "hub" && (
        <>
          <mesh position={[place.w * 0.3, place.h * 0.34, 0]}>
            <boxGeometry args={[place.w * 0.3, place.h * 0.66, place.d * 0.78]} />
            <meshStandardMaterial color="#b7cbc7" roughness={0.55} metalness={0.12} />
          </mesh>
          <mesh position={[0, 1.5, place.d / 2 + 2.2]}>
            <boxGeometry args={[place.w * 0.74, 2.8, 0.25]} />
            <meshStandardMaterial color={place.accent} roughness={0.75} />
          </mesh>
        </>
      )}
      {place.kind === "event" && (
        <mesh position={[0, place.h * 0.72, place.d / 2 + 0.2]}>
          <boxGeometry args={[place.w * 0.76, 1.1, 0.18]} />
          <meshStandardMaterial color="#56666a" roughness={0.4} metalness={0.16} />
        </mesh>
      )}
      {place.kind === "education" && (
        <>
          <mesh position={[place.w * 0.38, place.h / 2, -place.d * 0.1]}>
            <boxGeometry args={[place.w * 0.18, place.h + 2, place.d * 0.85]} />
            <meshStandardMaterial color={place.accent} roughness={0.9} />
          </mesh>
          <mesh position={[place.w * 0.38, place.h + 2, -place.d * 0.1]}>
            <boxGeometry args={[4, 2, 4]} />
            <meshStandardMaterial color="#e8dfca" roughness={0.9} />
          </mesh>
        </>
      )}
      {place.kind === "retail" && (
        <>
          <mesh position={[0, place.h + 2.1, 0]}>
            <boxGeometry args={[place.w * 0.78, 2.2, place.d * 0.72]} />
            <meshStandardMaterial color="#e4e2d9" roughness={0.6} metalness={0.08} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * place.w * 0.42, place.h / 2, place.d / 2 + 0.18]}>
              <boxGeometry args={[0.7, place.h * 0.82, 0.22]} />
              <meshStandardMaterial color={place.accent} roughness={0.75} />
            </mesh>
          ))}
        </>
      )}
      {place.kind === "dining" && (
        <>
          <mesh position={[0, 2.9, place.d / 2 + 2.35]}>
            <boxGeometry args={[place.w * 0.84, 0.28, 4.8]} />
            <meshStandardMaterial color={place.accent} roughness={0.85} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * place.w * 0.34, 1.55, place.d / 2 + 2.25]}>
              <boxGeometry args={[0.32, 2.7, 0.32]} />
              <meshStandardMaterial color="#eee0c5" roughness={0.9} />
            </mesh>
          ))}
        </>
      )}
      {isWideVenue && (
        <mesh position={[0, place.h + 0.95, 0]}>
          <boxGeometry args={[place.w * 0.82, 0.18, place.d * 0.82]} />
          <meshStandardMaterial color="#ede7d8" roughness={0.9} />
        </mesh>
      )}
      {(place.kind === "dining" || place.kind === "hub" || place.kind === "event") && (
        <mesh position={[0, 1.35, place.d / 2 + 2]}>
          <boxGeometry args={[place.w * 0.68, 0.28, 4]} />
          <meshStandardMaterial color={place.accent} roughness={0.8} />
        </mesh>
      )}
      {isPavilion && [-1, 1].map((side) => (
        <mesh key={side} position={[side * (place.w / 2 - 1), place.h / 2, place.d / 2 - 1]}>
          <boxGeometry args={[0.45, place.h, 0.45]} />
          <meshStandardMaterial color="#efe0bf" roughness={1} />
        </mesh>
      ))}
      {place.kind === "nightlife" && (
        <mesh position={[0, place.h * 0.62, place.d / 2 + 0.1]}>
          <boxGeometry args={[place.w * 0.82, 0.45, 0.16]} />
          <meshStandardMaterial color={place.accent} emissive={place.accent} emissiveIntensity={0.45} />
        </mesh>
      )}
      {place.kind === "nature" && (
        <mesh position={[place.w * 0.35, place.h + 4, -place.d * 0.28]}>
          <boxGeometry args={[1.2, 8, 1.2]} />
          <meshStandardMaterial color="#76553b" roughness={1} />
        </mesh>
      )}
    </group>
  );
}

function MarketRow({ x, z }: { x: number; z: number }) {
  const awnings = ["#d94637", "#e0ab32", "#397b57", "#3b6e9d", "#e6d5b2"];
  return (
    <group position={[x, 0, z]}>
      {Array.from({ length: 8 }, (_, i) => (
        <group key={i} position={[i * 4.2, 0, (i % 2) * 1.1]}>
          <mesh position={[0, 0.8, 0]}>
            <boxGeometry args={[3.3, 1.6, 2.8]} />
            <meshStandardMaterial color={i % 2 ? "#bb8455" : "#c49a68"} roughness={1} />
          </mesh>
          <mesh position={[0, 1.75, 0]}>
            <boxGeometry args={[3.8, 0.25, 3.2]} />
            <meshStandardMaterial color={awnings[i % awnings.length]} roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Tower crane with a prefab panel on the hook — the construction read. Static (map perf). */
function TowerCrane({ x, z, angle, h = 24 }: { x: number; z: number; angle: number; h?: number }) {
  const yellow = "#e0a13a";
  return (
    <group position={[x, 0, z]} rotation={[0, angle, 0]}>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[4.5, 0.6, 4.5]} />
        <meshStandardMaterial color="#8f8a80" roughness={1} />
      </mesh>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[1.4, h, 1.4]} />
        <meshStandardMaterial color={yellow} roughness={0.8} />
      </mesh>
      <mesh position={[0, h + 2, 0]}>
        <boxGeometry args={[0.9, 4, 0.9]} />
        <meshStandardMaterial color={yellow} roughness={0.8} />
      </mesh>
      {/* jib + counter-jib */}
      <mesh position={[6.5, h - 1, 0]}>
        <boxGeometry args={[17, 0.9, 0.9]} />
        <meshStandardMaterial color={yellow} roughness={0.8} />
      </mesh>
      <mesh position={[-6, h - 1, 0]}>
        <boxGeometry args={[6, 0.9, 0.9]} />
        <meshStandardMaterial color={yellow} roughness={0.8} />
      </mesh>
      <mesh position={[-8.5, h - 2.2, 0]}>
        <boxGeometry args={[1.2, 2.4, 1.6]} />
        <meshStandardMaterial color="#55524d" roughness={0.9} />
      </mesh>
      {/* tie bars */}
      {[
        { x: 6.5, len: 15.5, rz: 0.32 },
        { x: -6, len: 7.5, rz: -0.5 },
      ].map((tie, i) => (
        <mesh key={i} position={[tie.x, h + 0.6, 0]} rotation={[0, 0, tie.rz]}>
          <boxGeometry args={[tie.len, 0.12, 0.12]} />
          <meshStandardMaterial color="#3d3a36" roughness={0.9} />
        </mesh>
      ))}
      {/* hoist cable + hanging prefab panel */}
      <mesh position={[9, h - 4.5, 0]}>
        <boxGeometry args={[0.09, 7, 0.09]} />
        <meshStandardMaterial color="#2c2a27" roughness={0.9} />
      </mesh>
      <mesh position={[9, h - 9, 0]}>
        <boxGeometry args={[3.2, 2.2, 0.35]} />
        <meshStandardMaterial color="#d9d2c2" roughness={0.95} />
      </mesh>
    </group>
  );
}

/** Unfinished concrete frame: columns + floor slabs, no walls. */
function ConcreteFrame({ x, z, w, d, floors, floorH = 4 }: { x: number; z: number; w: number; d: number; floors: number; floorH?: number }) {
  const h = floors * floorH;
  const cols: [number, number][] = [];
  const nx = Math.max(2, Math.round(w / 5));
  const nz = Math.max(2, Math.round(d / 5));
  for (let ix = 0; ix < nx; ix++) {
    for (let iz = 0; iz < nz; iz++) {
      cols.push([-w / 2 + (ix * w) / (nx - 1), -d / 2 + (iz * d) / (nz - 1)]);
    }
  }
  return (
    <group position={[x, 0, z]}>
      {cols.map(([cx, cz], i) => (
        <mesh key={i} position={[cx, h / 2, cz]}>
          <boxGeometry args={[0.7, h, 0.7]} />
          <meshStandardMaterial color="#cfc8b8" roughness={0.95} />
        </mesh>
      ))}
      {Array.from({ length: floors }, (_, f) => (
        <mesh key={f} position={[0, (f + 1) * floorH, 0]}>
          <boxGeometry args={[w + 0.5, 0.5, d + 0.5]} />
          <meshStandardMaterial color="#bdb5a4" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Dangote Refinery mega-site, mid-construction: tank farm, distillation
 * columns, open concrete frames, scaffolds, tower cranes, cabins, hoarding.
 * Site: x 388–438, z 178–218. The ops block comes from its landmark entry.
 */
function RefineryConstruction() {
  const tanks: [number, number][] = [
    [429, 186], [436, 186], [429, 194], [436, 194], [429, 202], [436, 202],
  ];
  return (
    <group>
      {/* graded gravel pad, fence to fence */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[414, 0.15, 201]}>
        <planeGeometry args={[60, 38]} />
        <meshStandardMaterial color="#b3a893" roughness={1} />
      </mesh>
      {/* perimeter hoarding: north gate to the expressway, west gate to the access road */}
      {[
        { x: 392, z: 182, w: 16 },
        { x: 428, z: 182, w: 32 },
        { x: 414, z: 220, w: 60 },
        { x: 444, z: 201, w: 0, d: 38 },
      ].map((run, i) =>
        run.w > 0 ? (
          <mesh key={i} position={[run.x, 1.1, run.z]}>
            <boxGeometry args={[run.w, 2.2, 0.3]} />
            <meshStandardMaterial color="#db9d3c" roughness={0.9} />
          </mesh>
        ) : (
          <mesh key={i} position={[run.x, 1.1, run.z]}>
            <boxGeometry args={[0.3, 2.2, run.d]} />
            <meshStandardMaterial color="#db9d3c" roughness={0.9} />
          </mesh>
        ),
      )}
      {/* west fence split around the gate */}
      {[
        { z: 190, d: 16 },
        { z: 213, d: 14 },
      ].map((run, i) => (
        <mesh key={`w${i}`} position={[384, 1.1, run.z]}>
          <boxGeometry args={[0.3, 2.2, run.d]} />
          <meshStandardMaterial color="#db9d3c" roughness={0.9} />
        </mesh>
      ))}
      {/* storage tank farm */}
      {tanks.map(([tx, tz], i) => (
        <group key={i} position={[tx, 0, tz]}>
          <mesh position={[0, 4.5, 0]}>
            <cylinderGeometry args={[3.2, 3.2, 9, 14]} />
            <meshStandardMaterial color="#d8d5cc" roughness={0.7} />
          </mesh>
          <mesh position={[0, 9.1, 0]}>
            <cylinderGeometry args={[3.25, 3.25, 0.25, 14]} />
            <meshStandardMaterial color="#8f8a80" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* tank manifolds */}
      {[
        [423, 192],
        [423, 200],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, 0.6, pz]}>
          <boxGeometry args={[2, 1.2, 1]} />
          <meshStandardMaterial color="#7a756a" roughness={0.85} />
        </mesh>
      ))}
      {/* pipe rack along the south */}
      <mesh position={[418, 1.2, 218.5]}>
        <boxGeometry args={[28, 0.7, 0.9]} />
        <meshStandardMaterial color="#7a756a" roughness={0.85} />
      </mesh>
      {/* distillation columns with platforms */}
      {[
        { x: 396, z: 200, h: 24, r: 1.6 },
        { x: 392, z: 208, h: 20, r: 1.4 },
        { x: 400, z: 210, h: 16, r: 1.2 },
      ].map((c, i) => (
        <group key={i} position={[c.x, 0, c.z]}>
          <mesh position={[0, c.h / 2, 0]}>
            <cylinderGeometry args={[c.r, c.r * 1.1, c.h, 12]} />
            <meshStandardMaterial color="#c9c2b2" roughness={0.6} metalness={0.25} />
          </mesh>
          <mesh position={[0, c.h * 0.55, 0]}>
            <cylinderGeometry args={[c.r + 0.7, c.r + 0.7, 0.3, 12]} />
            <meshStandardMaterial color="#8f8a80" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* open frames going up */}
      <ConcreteFrame x={416} z={210} w={18} d={10} floors={2} />
      <ConcreteFrame x={392} z={187} w={12} d={8} floors={3} floorH={4} />
      {/* scaffold row on the 3-floor frame */}
      {[-4.5, -1.5, 1.5, 4.5].map((dx) => (
        <mesh key={dx} position={[392 + dx, 4, 191.8]}>
          <boxGeometry args={[0.16, 8, 0.16]} />
          <meshStandardMaterial color="#6b5f45" roughness={0.9} />
        </mesh>
      ))}
      {[2.5, 5.5].map((y) => (
        <mesh key={y} position={[392, y, 191.8]}>
          <boxGeometry args={[10, 0.14, 1.1]} />
          <meshStandardMaterial color="#9a7d55" roughness={0.95} />
        </mesh>
      ))}
      {/* tower cranes swinging loads over the frames */}
      <TowerCrane x={398} z={194} angle={0.5} />
      <TowerCrane x={434} z={214} angle={-2.2} h={27} />
      {/* site office cabins by the west gate */}
      {[196, 201].map((cz) => (
        <mesh key={cz} position={[388, 1.4, cz]}>
          <boxGeometry args={[6, 2.6, 2.4]} />
          <meshStandardMaterial color={cz === 196 ? "#dfe5e8" : "#274b73"} roughness={0.8} />
        </mesh>
      ))}
      {/* aggregate piles */}
      {[
        { x: 400, z: 216, r: 3 },
        { x: 394, z: 216, r: 2.5 },
      ].map((p, i) => (
        <mesh key={i} position={[p.x, 0, p.z]}>
          <coneGeometry args={[p.r, 2.6, 9]} />
          <meshStandardMaterial color="#9a938a" roughness={1} />
        </mesh>
      ))}
      {/* gate barriers */}
      {[198, 200.5, 203, 205.5].map((bz) => (
        <mesh key={bz} position={[382, 0.5, bz]}>
          <boxGeometry args={[0.4, 1, 2]} />
          <meshStandardMaterial color="#e07830" roughness={0.85} />
        </mesh>
      ))}
      {/* flare stack, unlit — still being built */}
      <group position={[388, 0, 214]}>
        <mesh position={[0, 15, 0]}>
          <cylinderGeometry args={[0.5, 0.7, 30, 8]} />
          <meshStandardMaterial color="#8f8a80" roughness={0.8} />
        </mesh>
        <mesh position={[0, 30.2, 0]}>
          <cylinderGeometry args={[0.7, 0.7, 0.8, 8]} />
          <meshStandardMaterial color="#55524d" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

/** Ship-to-shore cranes + stacked boxes on the port quay. */
function PortCranes() {
  const boxes = ["#b74c35", "#376c79", "#4f9a5b", "#8f8a80", "#db9d3c"];
  return (
    <group>
      {[424, 440].map((cx) => (
        <group key={cx} position={[cx, 0, 277.5]}>
          {[-3.5, 3.5].map((dx) =>
            [-2.5, 2.5].map((dz, j) => (
              <mesh key={`${dx}${j}`} position={[dx, 6, dz]}>
                <boxGeometry args={[0.8, 12, 0.8]} />
                <meshStandardMaterial color="#df9c35" roughness={0.8} />
              </mesh>
            )),
          )}
          <mesh position={[0, 12.7, 0]}>
            <boxGeometry args={[9, 1.4, 6.5]} />
            <meshStandardMaterial color="#df9c35" roughness={0.8} />
          </mesh>
          <mesh position={[0, 16, 0]}>
            <boxGeometry args={[2, 6, 2]} />
            <meshStandardMaterial color="#8f6a25" roughness={0.85} />
          </mesh>
          {/* boom reaching over the harbor water */}
          <mesh position={[0, 17.5, 10]}>
            <boxGeometry args={[1.2, 1.2, 22]} />
            <meshStandardMaterial color="#df9c35" roughness={0.8} />
          </mesh>
          <mesh position={[0, 12, 14]}>
            <boxGeometry args={[0.09, 9, 0.09]} />
            <meshStandardMaterial color="#2c2a27" roughness={0.9} />
          </mesh>
          <mesh position={[0, 6.5, 14]}>
            <boxGeometry args={[6, 2.6, 2.4]} />
            <meshStandardMaterial color="#376c79" roughness={0.85} />
          </mesh>
        </group>
      ))}
      {/* stacked export boxes east of the terminal */}
      {[262, 268].map((rz, r) =>
        [454, 460, 466].map((bx, i) => (
          <group key={`${r}${i}`} position={[bx, 0, rz]}>
            <mesh position={[0, 1.3, 0]}>
              <boxGeometry args={[6, 2.6, 2.4]} />
              <meshStandardMaterial color={boxes[(r * 3 + i) % boxes.length]} roughness={0.88} />
            </mesh>
            {i % 2 === 0 && (
              <mesh position={[0, 3.9, 0]}>
                <boxGeometry args={[6, 2.6, 2.4]} />
                <meshStandardMaterial color={boxes[(r * 3 + i + 2) % boxes.length]} roughness={0.88} />
              </mesh>
            )}
          </group>
        )),
      )}
    </group>
  );
}

/** Quarry crusher + aggregate cones. */
function QuarryPiles({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {[
        { dx: -5, dz: -3, r: 5, h: 4.5 },
        { dx: 2, dz: -4, r: 4, h: 3.6 },
        { dx: 5, dz: 3, r: 5.5, h: 5 },
      ].map((p, i) => (
        <mesh key={i} position={[p.dx, 0, p.dz]}>
          <coneGeometry args={[p.r, p.h, 9]} />
          <meshStandardMaterial color={i === 1 ? "#8a8378" : "#9a938a"} roughness={1} />
        </mesh>
      ))}
      <mesh position={[0, 2, 4]}>
        <boxGeometry args={[7, 4, 3]} />
        <meshStandardMaterial color="#6f6a5e" roughness={0.9} />
      </mesh>
      <mesh position={[-3, 3.4, 0]} rotation={[0, 0.5, 0.5]}>
        <boxGeometry args={[0.8, 0.4, 9]} />
        <meshStandardMaterial color="#55524d" roughness={0.9} />
      </mesh>
    </group>
  );
}

function CityTrees() {
  const spots = useMemo(
    () => [
      [-43, -117], [-35, -117], [-27, -117], [35, -117], [43, -117],
      [-145, -17], [-137, -17], [-63, -17], [-55, -17], [57, -17], [65, -17],
      [-45, 28], [-37, 28], [39, 28], [47, 28],
      [-86, 101], [-78, 101], [76, 104], [84, 104], [78, 155], [86, 155],
      [-144, 32], [-136, 32], [143, 32], [151, 32],
    ] as [number, number][],
    [],
  );
  const trunks = useRef<THREE.InstancedMesh>(null);
  const canopies = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    if (!trunks.current || !canopies.current) return;
    spots.forEach(([x, z], index) => {
      const scale = 0.8 + (index % 4) * 0.12;
      dummy.position.set(x, 1.1 * scale, z);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      trunks.current!.setMatrixAt(index, dummy.matrix);
      dummy.position.set(x, 2.8 * scale, z);
      dummy.updateMatrix();
      canopies.current!.setMatrixAt(index, dummy.matrix);
    });
    trunks.current.instanceMatrix.needsUpdate = true;
    canopies.current.instanceMatrix.needsUpdate = true;
  }, [dummy, spots]);

  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, undefined, spots.length]}>
        <cylinderGeometry args={[0.17, 0.24, 2.2, 6]} />
        <meshStandardMaterial color="#745034" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={canopies} args={[undefined, undefined, spots.length]}>
        <coneGeometry args={[1.4, 2.5, 7]} />
        <meshStandardMaterial color="#3d7945" roughness={1} />
      </instancedMesh>
    </group>
  );
}

function RegionLabel({ position, children, visible }: { position: [number, number, number]; children: string; visible: boolean }) {
  return (
    <group position={position}>
      <Html center distanceFactor={120} wrapperClass="venue-label" style={{ pointerEvents: "none", visibility: visible ? "visible" : "hidden" }}>
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

/** Static, expanded Lagos city map. Playable Yaba roads and plots stay at their original coordinates. */
export function LagosMapBlocks({ onPick, labelsVisible = true }: { onPick?: (plotId: string) => void; labelsVisible?: boolean }) {
  const roads = useMemo(() => ROADS, []);
  const cityRoads = useMemo(() => CITY_ROADS, []);
  const plots = useMemo(() => PLOTS, []);
  const estates = useMemo(() => buildEstates(), []);
  const downAt = useRef<{ x: number; y: number } | null>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const leaderRefs = useRef<(HTMLSpanElement | null)[]>([]);

  return (
    <group>
      {/* ocean */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[60, -0.35, 60]}>
        <planeGeometry args={[1100, 1000]} />
        <meshStandardMaterial color="#6fb3d2" roughness={1} />
      </mesh>
      {/* mainland: Yaba grows into denser mixed residential and commercial districts */}
      <mesh geometry={MAINLAND_GEOMETRY} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.13, 0]}>
        <meshStandardMaterial color="#a9bd87" roughness={1} />
      </mesh>
      {/* Lagos Island and Victoria Island */}
      <mesh geometry={ISLAND_GEOMETRY} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.13, 0]}>
        <meshStandardMaterial color="#d7c69f" roughness={1} />
      </mesh>
      {/* Eko Atlantic and the Lekki peninsula */}
      <mesh geometry={EKO_GEOMETRY} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.13, 0]}>
        <meshStandardMaterial color="#d8c9a6" roughness={1} />
      </mesh>
      <mesh geometry={LEKKI_GEOMETRY} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.13, 0]}>
        <meshStandardMaterial color="#b9c78e" roughness={1} />
      </mesh>
      {/* Ibeju-Lekki industrial mainland — overlaps Lekki slightly, 5mm lower to avoid shimmer */}
      <mesh geometry={IBEJU_GEOMETRY} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.125, 0]}>
        <meshStandardMaterial color="#c2b28e" roughness={1} />
      </mesh>
      {/* graded concrete aprons across the industrial belt (below landmark pads + roads) */}
      {[
        { x: 361, z: 226, w: 50, d: 88 },
        { x: 390.5, z: 261, w: 45, d: 38 },
        { x: 432, z: 277, w: 40, d: 6 },
        { x: 459, z: 248.5, w: 26, d: 61 },
      ].map((a, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[a.x, 0.15, a.z]}>
          <planeGeometry args={[a.w, a.d]} />
          <meshStandardMaterial color="#b0a898" roughness={1} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-164, 0.15, 190]}>
        <circleGeometry args={[22, 40]} />
        <meshStandardMaterial color="#e1cb96" roughness={1} />
      </mesh>
      {/* lagoon and beach edges */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, 64]}>
        <planeGeometry args={[330, 24]} />
        <meshStandardMaterial color="#4e9fc1" roughness={0.82} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[16, 0.12, 179]}>
        <planeGeometry args={[300, 10]} />
        <meshStandardMaterial color="#e0c68e" roughness={1} />
      </mesh>
      {/* neighborhood parks and civic greens */}
      {[
        [-38, -116, 22, 15],
        [34, -116, 22, 15],
        [-103, -15, 18, 13],
        [106, -17, 20, 14],
        [-81, 104, 12, 12],
        [78, 151, 14, 14],
      ].map(([x, z, w, d], index) => (
        <mesh key={index} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.1, z]}>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial color={index % 2 ? "#91ad70" : "#96b277"} roughness={1} />
        </mesh>
      ))}
      {/* connected, marked streets and the existing playable Yaba roads */}
      <mesh geometry={APAPA_GEOMETRY} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.13, 0]}>
        <meshStandardMaterial color="#c6b995" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-220, 0.145, 56]}>
        <planeGeometry args={[76, 12]} />
        <meshStandardMaterial color="#478eaa" roughness={0.85} />
      </mesh>
      {/* fixed height ordering prevents coplanar road crossings from shimmering */}
      {cityRoads.map((road) => (
        <RoadStrip key={road.id} road={road} elevation={road.axis === "x" ? 0.18 : 0.215} />
      ))}
      {roads.map((road) => (
        <RoadStrip key={road.id} road={road} elevation={road.axis === "x" ? 0.255 : 0.29} />
      ))}
      {[-110, 0, 110].map((x) => <Bridge key={x} x={x} />)}
      {/* compounds and detached homes */}
      <EstateInstances houses={estates.mainland} />
      <EstateInstances houses={estates.island} />
      <EstateInstances houses={estates.lekki} />
      <EstateInstances houses={estates.ajah} />
      <EstateInstances houses={estates.ibeju} />
      {LANDMARKS.map((place, index) => (
        <LandmarkBuilding
          key={`${place.name}-${place.district}`}
          place={place}
          index={index}
          labelRefs={labelRefs}
          leaderRefs={leaderRefs}
          labelsVisible={labelsVisible}
        />
      ))}
      <LandmarkLabelLayout labels={labelRefs} leaders={leaderRefs} active={labelsVisible} />
      {/* Ibeju-Lekki industrial belt dressing */}
      <RefineryConstruction />
      <PortCranes />
      <QuarryPiles x={360} z={274} />
      {[
        [-111, -115, 27, 21],
        [104, -115, 30, 21],
        [-111, -74, 27, 19],
        [104, -74, 30, 19],
        [-27, -42, 29, 16],
        [-27, 32, 29, 16],
        [-45, 104, 34, 29],
        [119, 106, 39, 30],
        [165, 151, 36, 30],
      ].map(([x, z, w, d], index) => (
        <CompoundWall key={index} x={x} z={z} w={w} d={d} />
      ))}
      {/* a busy open market row beside the Yaba neighbourhood */}
      <MarketRow x={42} z={-36} />
      <group position={[-44, 0.16, -108]} rotation={[0, Math.PI / 2, 0]}>
        <Danfo position={[0, 0, 0]} />
      </group>
      <group position={[54, 0.16, 48]} rotation={[0, Math.PI / 2, 0]}>
        <Danfo position={[0, 0, 0]} />
      </group>
      <Danfo position={[-125, 0.16, -94]} />
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
      <CityTrees />
      <RegionLabel visible={labelsVisible} position={[45, 0.5, 12]}>YABA</RegionLabel>
      <RegionLabel visible={labelsVisible} position={[-112, 0.5, -32]}>SURULERE</RegionLabel>
      <RegionLabel visible={labelsVisible} position={[12, 0.5, -124]}>IKEJA</RegionLabel>
      <RegionLabel visible={labelsVisible} position={[-3, 0.5, 74]}>LAGOS LAGOON</RegionLabel>
      <RegionLabel visible={labelsVisible} position={[-24, 0.5, 142]}>VICTORIA ISLAND</RegionLabel>
      <RegionLabel visible={labelsVisible} position={[145, 0.5, 174]}>LEKKI</RegionLabel>
      <RegionLabel visible={labelsVisible} position={[-126, 0.5, 160]}>EKO ATLANTIC</RegionLabel>
      <RegionLabel visible={labelsVisible} position={[228, 0.5, 215]}>LEKKI · AJAH</RegionLabel>
      <RegionLabel visible={labelsVisible} position={[-222, 0.5, 44]}>APAPA PORT</RegionLabel>
      <RegionLabel visible={labelsVisible} position={[324, 0.5, 253]}>SANGOTEDO · IBEJU-LEKKI</RegionLabel>
      <RegionLabel visible={labelsVisible} position={[408, 0.5, 162]}>IBEJU-LEKKI INDUSTRIAL BELT</RegionLabel>
    </group>
  );
}
