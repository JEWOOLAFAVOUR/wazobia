"use client";

import { useEffect, useState } from "react";
import { api, formatNaira } from "@/lib/api";

function newKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `key-${Date.now()}`;
}

type MenuItem = { itemId: string; name: string; priceKobo: number; qty: number };
type Shop = { id: string; name: string; kind: string; menu?: MenuItem[] };

export default function BuySheet({ onToast, refreshStatus }: { onToast: (m: string | null) => void; refreshStatus: () => void }) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    api<Shop[]>("/api/shops")
      .then(async (list) => {
        const full = await Promise.all(
          list.slice(0, 6).map((s) => api<Shop>(`/api/shops/${s.id}`).catch(() => s)),
        );
        setShops(full);
        if (full[0]) setOpen(full[0].id);
      })
      .catch(() => {});
  }, []);

  const buy = async (shopId: string, itemId: string, name: string) => {
    setBusy(itemId);
    try {
      const key = newKey();
      const r = await api<{ priceKobo: number; newBalanceKobo: number }>("/api/purchases", {
        method: "POST",
        body: JSON.stringify({ shopId, itemId, idempotencyKey: key }),
      });
      onToast(`${name} · ${formatNaira(r.priceKobo)} · balance ${formatNaira(r.newBalanceKobo)}`);
      refreshStatus();
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      if (m.includes("401")) onToast("Log in on the main page to buy.");
      else if (m.includes("402")) onToast("Not enough cash.");
      else onToast("Sale failed — try again.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="pointer-events-auto bg-white/95 rounded-3xl shadow-xl p-4 max-h-[46vh] overflow-y-auto w-full max-w-md">
      <div className="text-sm font-bold text-slate-800 mb-2">Nearby shops</div>
      {shops.length === 0 && <div className="text-xs text-slate-400">Loading shops…</div>}
      {shops.map((s) => (
        <div key={s.id} className="mb-2">
          <button onClick={() => setOpen(open === s.id ? null : s.id)} className="w-full text-left text-sm font-semibold text-slate-700 bg-slate-100 rounded-2xl px-4 py-2.5">
            🏪 {s.name}
          </button>
          {open === s.id && (
            <div className="flex flex-col gap-1 mt-1 ml-2">
              {(s.menu ?? []).map((m) => (
                <div key={m.itemId} className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2">
                  <span>
                    {m.name} · <b>{formatNaira(m.priceKobo)}</b> <span className="text-slate-400">({m.qty} left)</span>
                  </span>
                  <button
                    disabled={!!busy || m.qty <= 0}
                    onClick={() => buy(s.id, m.itemId, m.name)}
                    className="ml-auto rounded-full bg-emerald-500 text-white text-xs font-bold px-3 py-1 disabled:opacity-40"
                  >
                    {busy === m.itemId ? "…" : "Buy"}
                  </button>
                </div>
              ))}
              {(!s.menu || s.menu.length === 0) && <div className="text-xs text-slate-400 px-3">No stock right now.</div>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
