// Wazobia shared protocol — single source of truth (guide.md §57).
// Frontend and backend MUST NOT duplicate these shapes independently.
// Go mirror: apps/server/internal/{player,world,movement,...} (same JSON field names).

export type Vec3 = { x: number; y: number; z: number };

export type PlayerState = {
  userId: string;
  displayName: string;
  district: string;
  zone: string;
  position: Vec3;
  balanceKobo: number;
  home: string;
};

export type Position = { x: number; z: number; zone: string };

export type MovementUpdate = {
  type: "move";
  userId: string;
  x: number;
  z: number;
  zone: string;
};

export type ChatScope = "global" | "district" | "zone" | "nearby" | "business" | "org" | "event" | "private";

export type ChatMessage = {
  type: "chat";
  scope: ChatScope;
  from: string;
  zone?: string;
  text: string;
  at: number;
};

export type PresenceUpdate = {
  userId: string;
  status: "online" | "offline";
  district: string;
  zone: string;
  x: number;
  z: number;
  lastSeen: number;
};

export type BuildingState = {
  id: string;
  zone: string;
  kind: "apartment" | "shop" | "office" | "restaurant" | "bank" | "church" | "mosque" | "club" | "park" | string;
  name: string;
  x: number;
  z: number;
  open: boolean;
};

export type InventoryItem = {
  itemId: string;
  quantity: number;
  quality?: number;
  purchasePriceKobo?: number;
  location?: string;
};

export type Transaction = {
  id: string;
  type: string;
  reference: string;
  status: "pending" | "committed" | "failed";
  idempotencyKey?: string;
  createdAt: string;
};
