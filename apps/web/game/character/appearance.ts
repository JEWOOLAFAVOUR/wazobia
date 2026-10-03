import * as THREE from "three";
import type { CharacterId } from "./characters";

// The free-pack albedo is a mid-brown "Dark" variant, so tones are implemented
// as tint multipliers: target tone ÷ sampled base albedo, applied to the skin
// material color. Immediate, no extra textures, no backend. Swatches show the
// *result* tone, not the multiplier.
export type SkinTone = { id: string; label: string; swatch: string; target: [number, number, number] };

export const SKIN_TONES: SkinTone[] = [
  { id: "light", label: "Light", swatch: "#f2cfae", target: [242, 207, 174] },
  { id: "golden", label: "Golden", swatch: "#dfa875", target: [223, 168, 117] },
  { id: "bronze", label: "Bronze", swatch: "#b57a48", target: [181, 122, 72] },
  { id: "deep", label: "Deep", swatch: "#7c4a2b", target: [124, 74, 43] },
  { id: "ebony", label: "Ebony", swatch: "#4e2d1a", target: [78, 45, 26] },
];

// Sampled center-region averages of the shipped albedo textures.
const BASE_SKIN: Record<CharacterId, [number, number, number]> = {
  male: [152, 106, 76],
  female: [164, 113, 79],
};

// Hair albedo is mid-gray (meant to be tinted — the Source tier does this with
// shaders). Without a tint the hair renders ashy gray, so a dark default tint
// is also a visual fix, not just an option.
export type HairColor = { id: string; label: string; swatch: string; target: [number, number, number] };

export const HAIR_COLORS: HairColor[] = [
  { id: "black", label: "Black", swatch: "#241d19", target: [36, 29, 25] },
  { id: "brown", label: "Dark brown", swatch: "#4a3220", target: [74, 50, 32] },
  { id: "chestnut", label: "Chestnut", swatch: "#7a4a28", target: [122, 74, 40] },
];

const BASE_HAIR: [number, number, number] = [143, 144, 140];

// Eye texture mixes sclera + iris, so eye options are direct multipliers
// (safe on any content) rather than absolute tones.
export type EyeColor = { id: string; label: string; swatch: string; mult: [number, number, number] };

export const EYE_COLORS: EyeColor[] = [
  { id: "espresso", label: "Dark brown", swatch: "#3a2417", mult: [1, 1, 1] },
  { id: "black", label: "Black", swatch: "#14100c", mult: [0.35, 0.35, 0.38] },
  { id: "amber", label: "Amber", swatch: "#8a5a28", mult: [1.25, 0.95, 0.6] },
];

const SKIN_MATERIALS = new Set(["MI_Superhero_Male", "MI_Superhero_Female"]);
const HAIR_MATERIALS = new Set(["MI_Hair_1", "MI_Hair_2"]);
const EYE_MATERIALS = new Set(["MI_Eyes"]);

function multiplier(target: [number, number, number], base: [number, number, number]): THREE.Color {
  return new THREE.Color(target[0] / base[0], target[1] / base[1], target[2] / base[2]);
}

export function applyAppearance(
  scene: THREE.Object3D,
  body: CharacterId,
  skinId: string,
  hairId: string,
  eyesId: string,
): void {
  const skin = SKIN_TONES.find((t) => t.id === skinId) ?? SKIN_TONES[2];
  const hair = HAIR_COLORS.find((h) => h.id === hairId) ?? HAIR_COLORS[0];
  const eyes = EYE_COLORS.find((e) => e.id === eyesId) ?? EYE_COLORS[0];
  const skinTint = multiplier(skin.target, BASE_SKIN[body]);
  const hairTint = multiplier(hair.target, BASE_HAIR);
  const eyeTint = new THREE.Color(...eyes.mult);
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      const std = mat as THREE.MeshStandardMaterial;
      if (!std || typeof std.name !== "string" || !("color" in std)) continue;
      if (SKIN_MATERIALS.has(std.name)) std.color.copy(skinTint);
      else if (HAIR_MATERIALS.has(std.name)) std.color.copy(hairTint);
      else if (EYE_MATERIALS.has(std.name)) std.color.copy(eyeTint);
    }
  });
}
