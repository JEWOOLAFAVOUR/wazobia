export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type Building = {
  id: string;
  zone: string;
  kind: string;
  name: string;
  x: number;
  z: number;
  open: boolean;
};

export const fallbackBuildings: Building[] = [
  { id: "apt-1", zone: "zone-a", kind: "apartment", name: "Shared Apartments", x: -20, z: 10, open: true },
  { id: "rest-1", zone: "zone-b", kind: "restaurant", name: "Mama Put Spot", x: 10, z: -5, open: true },
  { id: "shop-1", zone: "zone-b", kind: "shop", name: "Corner Shop", x: 18, z: 8, open: true },
  { id: "bank-1", zone: "zone-b", kind: "bank", name: "Wazobia Bank", x: -8, z: -18, open: true },
];

export type MenuItem = { itemId: string; name: string; priceKobo: number; qty: number };
export type Shop = { id: string; name: string; zone: string; kind: string; open: boolean; menu?: MenuItem[] };
export type WalletItem = { itemId: string; qty: number; name: string; priceKobo: number };
export type Wallet = { balanceKobo: number; home: string; displayName: string; inventory: WalletItem[]; recent: unknown[] };
export type Receipt = { transactionId: string; shopId: string; itemId: string; priceKobo: number; newBalanceKobo: number; newQty: number; idempotentReplay?: boolean };

export function formatNaira(kobo: number): string {
  const naira = kobo / 100;
  return "₦" + naira.toLocaleString("en-NG");
}
