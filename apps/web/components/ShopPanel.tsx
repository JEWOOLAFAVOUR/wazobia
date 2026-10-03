"use client";

import { useEffect, useState } from "react";
import { api, formatNaira, type Shop, type Wallet, type Receipt } from "@/lib/api";

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `key-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function ShopPanel({
  shopId,
  walletKey,
  onPurchased,
}: {
  shopId: string | null;
  walletKey: number;
  onPurchased?: () => void;
}) {
  const [shop, setShop] = useState<Shop | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    if (!shopId) return;
    let alive = true;
    api<Shop>(`/api/shops/${shopId}`)
      .then((s) => { if (alive) setShop(s); })
      .catch(() => { if (alive) setShop(null); });
    return () => { alive = false; };
  }, [shopId]);

  useEffect(() => {
    let alive = true;
    api<Wallet>("/api/wallet")
      .then((w) => { if (alive) setWallet(w); })
      .catch(() => { if (alive) setWallet(null); });
    return () => { alive = false; };
  }, [walletKey]);

  if (!shopId) return null;

  const buy = async (itemId: string) => {
    setMsg("");
    setBusy(itemId);
    try {
      const key = newIdempotencyKey();
      const r = await api<Receipt>("/api/purchases", {
        method: "POST",
        body: JSON.stringify({ shopId, itemId, idempotencyKey: key }),
      });
      setMsg(`Bought ${itemId} for ${formatNaira(r.priceKobo)} · balance ${formatNaira(r.newBalanceKobo)}${r.idempotentReplay ? " (replay)" : ""}`);
      api<Shop>(`/api/shops/${shopId}`).then(setShop).catch(() => {});
      onPurchased?.();
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      if (m.includes("402")) setMsg("Insufficient funds — earn first (jobs land in Phase 5).");
      else if (m.includes("401")) setMsg("Log in above first — purchases need a Wazobia account.");
      else if (m.includes("409")) setMsg("Out of stock — try another item.");
      else setMsg("Purchase failed — is the API online?");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="font-semibold">{shop?.name ?? shopId}</div>
        {wallet && <div className="ml-auto text-amber-300 font-bold">{formatNaira(wallet.balanceKobo)}</div>}
      </div>
      {!shop ? (
        <div className="text-zinc-400 text-xs">Loading menu… (API offline?)</div>
      ) : (
        <div className="flex flex-col gap-1">
          {(shop.menu ?? []).map((m) => (
            <div key={m.itemId} className="flex items-center gap-2 rounded-lg bg-black/40 px-2 py-1.5">
              <span>{m.name}</span>
              <span className="text-zinc-400 text-xs">{formatNaira(m.priceKobo)} · {m.qty} left</span>
              <button
                disabled={!!busy || m.qty <= 0}
                onClick={() => buy(m.itemId)}
                className="ml-auto rounded-lg bg-amber-400 text-black font-bold px-3 py-1 text-xs disabled:opacity-40"
              >
                {busy === m.itemId ? "…" : "Buy"}
              </button>
            </div>
          ))}
          {(!shop.menu || shop.menu.length === 0) && <div className="text-zinc-400 text-xs">No stock.</div>}
        </div>
      )}
      {wallet && wallet.inventory.length > 0 && (
        <div className="text-xs text-zinc-300">🎒 {wallet.inventory.map((i) => `${i.name}×${i.qty}`).join(" · ")}</div>
      )}
      {msg && <div className="text-xs text-zinc-200">{msg}</div>}
    </div>
  );
}
