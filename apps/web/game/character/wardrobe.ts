import type { CharacterId } from "./characters";

// Full avatar state — local frontend state only (no backend in Phase 2B).
export type Avatar = {
  body: CharacterId;
  skin: string;
  hair: string;
  eyes: string;
  top: { id: TopId; color: string } | null;
  bottom: { id: BottomId; color: string } | null;
  shoes: { id: ShoeId; color: string } | null;
  headwear: { id: HeadwearId; color: string };
  accessory: AccessoryId;
  name: string;
  situation: string;
};

export type TopId = "tee" | "polo" | "shirt" | "longsleeve" | "native";
export type BottomId = "trousers" | "jeans" | "shorts" | "skirt";
export type ShoeId = "sneakers" | "leather" | "sandals" | "slides";
export type HeadwearId = "none" | "cap" | "wrap";
export type AccessoryId = "none" | "glasses" | "watch" | "backpack" | "handbag";

export const DEFAULT_AVATAR: Avatar = {
  body: "male",
  skin: "deep",
  hair: "black",
  eyes: "espresso",
  top: { id: "tee", color: "#2e6b46" },
  bottom: { id: "jeans", color: "#2f4a6b" },
  shoes: { id: "sneakers", color: "#eceae6" },
  headwear: { id: "none", color: "#1c1a18" },
  accessory: "none",
  name: "",
  situation: "",
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
