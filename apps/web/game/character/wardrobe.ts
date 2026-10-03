// Lightweight stylized avatar state — local frontend state only.
// Main line uses zero-download procedural characters (see SimpleAvatar.tsx).
// The realistic Quaternius track lives on branch wip/quaternius-avatar.
export type CharacterId = "male" | "female";

// Full avatar state — local frontend state only (no backend in Phase 2B).
export type Avatar = {
  body: CharacterId;
  skin: string;
  hair: { cut: HairCutId; color: string };
  eyes: string;
  top: { id: TopId; color: string } | null;
  bottom: { id: BottomId; color: string } | null;
  shoes: { id: ShoeId; color: string } | null;
  headwear: { id: HeadwearId; color: string };
  accessory: AccessoryId;
  name: string;
  situation: string;
  outfit: OutfitId;
  fabric: string;
};

export type TopId = "tee" | "polo" | "shirt" | "longsleeve" | "native";
export type BottomId = "trousers" | "jeans" | "shorts" | "skirt";
export type ShoeId = "sneakers" | "leather" | "sandals" | "slides";
export type HeadwearId = "none" | "cap" | "wrap";
export type AccessoryId = "none" | "glasses" | "watch" | "backpack" | "handbag";
export type HairCutId = "lowcut" | "classic" | "afro" | "braids" | "locs" | "bun" | "ponytail" | "long" | "medium" | "gele";

export const HAIR_CUTS: { id: HairCutId; label: string; bodies: CharacterId[] }[] = [
  { id: "braids", label: "Braids", bodies: ["male", "female"] },
  { id: "afro", label: "Afro", bodies: ["male", "female"] },
  { id: "bun", label: "Bun", bodies: ["female"] },
  { id: "ponytail", label: "Ponytail", bodies: ["female"] },
  { id: "long", label: "Long", bodies: ["male", "female"] },
  { id: "locs", label: "Locs", bodies: ["male", "female"] },
  { id: "lowcut", label: "Low cut", bodies: ["male", "female"] },
  { id: "gele", label: "Gele", bodies: ["female"] },
  { id: "classic", label: "Classic", bodies: ["male", "female"] },
  { id: "medium", label: "Medium", bodies: ["male", "female"] },
];

export type OutfitId = "casual" | "office" | "owambe" | "sitework";

export const OUTFITS: { id: OutfitId; label: string }[] = [
  { id: "casual", label: "Casual" },
  { id: "office", label: "Office" },
  { id: "owambe", label: "Owambe" },
  { id: "sitework", label: "Site work" },
];

export const FABRICS: { id: string; label: string; swatch: string; top: string }[] = [
  { id: "gold", label: "Ankara gold", swatch: "#d9a62e", top: "#c9932b" },
  { id: "royal", label: "Royal blue", swatch: "#274b73", top: "#274b73" },
  { id: "emerald", label: "Emerald", swatch: "#2e6b46", top: "#2e6b46" },
  { id: "crimson", label: "Crimson", swatch: "#a83a32", top: "#a83a32" },
  { id: "purple", label: "Adire purple", swatch: "#5b3a75", top: "#5b3a75" },
  { id: "ivory", label: "Ivory", swatch: "#f5f3ee", top: "#f5f3ee" },
  { id: "charcoal", label: "Charcoal", swatch: "#2a2725", top: "#2a2725" },
];

export const DEFAULT_AVATAR: Avatar = {
  body: "female",
  skin: "deep",
  hair: { cut: "braids", color: "black" },
  eyes: "espresso",
  top: { id: "native", color: "#c9932b" },
  bottom: { id: "skirt", color: "#1d1d22" },
  shoes: { id: "leather", color: "#5a3a24" },
  headwear: { id: "none", color: "#1c1a18" },
  accessory: "none",
  name: "",
  situation: "",
  outfit: "owambe",
  fabric: "gold",
};

export const TOP_LABELS: Record<TopId, string> = {
  tee: "T-shirt",
  polo: "Polo",
  shirt: "Button-up",
  longsleeve: "Long-sleeve",
  native: "Native top",
};

export const BOTTOM_LABELS: Record<BottomId, string> = {
  trousers: "Trousers",
  jeans: "Jeans",
  shorts: "Shorts",
  skirt: "Skirt",
};

export const SHOE_LABELS: Record<ShoeId, string> = {
  sneakers: "Sneakers",
  leather: "Leather shoes",
  sandals: "Sandals",
  slides: "Slides",
};

export const TOP_COLORS = ["#f5f3ee", "#1c1a18", "#2e6b46", "#274b73", "#c96a2c", "#5b3a75", "#a83a32", "#d9a62e"];
export const BOTTOM_COLORS = ["#2f4a6b", "#201d1a", "#a08c5b", "#5c5f66", "#3d3a45", "#7a4a28"];
export const SHOE_COLORS = ["#eceae6", "#1c1a18", "#5a3a24", "#274b73", "#a83a32"];
export const CLOTH_COLORS = ["#1c1a18", "#2e6b46", "#274b73", "#a83a32", "#d9a62e", "#5b3a75", "#eceae6"];

export const SITUATIONS = ["Student", "Looking for work", "Working", "Freelancer", "Small business owner"];
