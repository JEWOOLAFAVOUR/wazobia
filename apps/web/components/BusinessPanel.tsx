"use client";

import { useCallback, useEffect, useState } from "react";
import { api, formatNaira } from "@/lib/api";

type Biz = { id: string; name: string; kind: string; zone: string; open: boolean; cashKobo?: number; owner?: boolean };
type Product = { itemId: string; name: string; priceKobo: number; qty: number };
type Detail = { id: string; name: string; kind: string; zone: string; open: boolean; staff: number; menu: Product[] };

function newKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `key-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function BusinessPanel({ refreshKey, onMoney }: { refreshKey: number; onMoney?: () => void }) {
  const [mine, setMine] = useState<Biz[]>([]);
  const [all, setAll] = useState<Biz[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState("restaurant");
  const [msg, setMsg] = useState("");
  const [itemId, setItemId] = useState("jollof");
  const [price, setPrice] = useState("3000");
  const [qty, setQty] = useState("10");
  const [hireEmail, setHireEmail] = useState("");
  const [wage, setWage] = useState("1000");

  const load = useCallback(() => {
    api<Biz[]>("/api/businesses/mine").then(setMine).catch(() => setMine([]));
    api<Biz[]>("/api/businesses").then(setAll).catch(() => setAll([]));
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const openDetail = (id: string) => {
    api<Detail>(`/api/businesses/${id}`).then(setDetail).catch(() => setMsg("Could not load business."));
  };

  const create = async () => {
    setMsg("");
    try {
      const r = await api<{ id: string }>("/api/businesses", { method: "POST", body: JSON.stringify({ name, kind, zone: "zone-b" }) });
      setName("");
      setMsg("Business opened! Add a product, then restock from the wholesaler (60% of retail).");
      load();
      onMoney?.();
      openDetail(r.id);
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      if (m.includes("402")) setMsg("Need ₦20,000 license fee — work a few shifts first.");
      else if (m.includes("401")) setMsg("Log in first.");
      else setMsg("Create failed — is the API online?");
    }
  };

  const ownerAct = async (path: string, body: unknown, doneMsg: string) => {
    setMsg("");
    try {
      await api(path, { method: "POST", body: JSON.stringify(body) });
      setMsg(doneMsg);
      if (detail) openDetail(detail.id);
      load();
      onMoney?.();
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      if (m.includes("403")) setMsg("Owner only.");
      else if (m.includes("402")) setMsg("Insufficient funds.");
      else if (m.includes("409")) setMsg("Out of stock.");
      else setMsg("Action failed.");
    }
  };

  const buy = async (bizId: string, item: string) => {
    setMsg("");
    try {
      const r = await api<{ priceKobo: number; newBalanceKobo: number }>(`/api/businesses/${bizId}/buy`, {
        method: "POST",
        body: JSON.stringify({ itemId: item, idempotencyKey: newKey() }),
      });
      setMsg(`Bought for ${formatNaira(r.priceKobo)} · balance ${formatNaira(r.newBalanceKobo)}`);
      if (detail) openDetail(detail.id);
      onMoney?.();
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      if (m.includes("402")) setMsg("Insufficient funds.");
      else if (m.includes("409")) setMsg("Out of stock / closed.");
      else if (m.includes("401")) setMsg("Log in first.");
      else setMsg("Buy failed.");
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 p-3 text-sm bg-black/40 flex flex-col gap-3">
      <div className="font-semibold">Businesses <span className="text-zinc-500 font-normal">(own → stock → sell → hire)</span></div>

      <div className="flex gap-2 flex-wrap">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Business name" className="rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 outline-none focus:border-amber-400 flex-1 min-w-32" />
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1.5">
          <option value="restaurant">Restaurant</option>
          <option value="shop">Shop</option>
          <option value="bar">Bar</option>
          <option value="tech">Tech</option>
          <option value="transport">Transport</option>
        </select>
        <button onClick={create} disabled={!name.trim()} className="rounded-lg bg-amber-400 text-black font-bold px-3 py-1.5 disabled:opacity-40">Open · ₦20,000</button>
      </div>

      {mine.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {mine.map((b) => (
            <button key={b.id} onClick={() => openDetail(b.id)} className="rounded-lg border border-amber-500/50 px-2 py-1 text-xs hover:bg-amber-500/10">
              {b.name} · {formatNaira(b.cashKobo ?? 0)} till
            </button>
          ))}
        </div>
      )}

      {detail ? (
        <div className="rounded-lg bg-zinc-900/60 p-2 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <b>{detail.name}</b>
            <span className="text-zinc-500 text-xs">{detail.kind} · {detail.zone} · {detail.staff} staff · {detail.open ? "open" : "closed"}</span>
            <button onClick={() => setDetail(null)} className="ml-auto text-xs text-zinc-400">close</button>
          </div>
          {detail.menu.map((m) => (
            <div key={m.itemId} className="flex items-center gap-2 text-xs">
              <span>{m.name} · {formatNaira(m.priceKobo)} · {m.qty} left</span>
              <button onClick={() => buy(detail.id, m.itemId)} className="ml-auto rounded bg-amber-400 text-black font-bold px-2 py-0.5">Buy</button>
            </div>
          ))}
          {detail.menu.length === 0 && <div className="text-xs text-zinc-500">No products yet — owners add one below.</div>}
          <div className="border-t border-zinc-800 pt-2 flex flex-col gap-2 text-xs">
            <div className="flex gap-1 flex-wrap items-center">
              <select value={itemId} onChange={(e) => setItemId(e.target.value)} className="rounded bg-zinc-800 border border-zinc-700 px-1 py-1">
                <option value="jollof">Jollof</option>
                <option value="bread">Bread</option>
                <option value="water">Water</option>
              </select>
              <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="₦ price" className="w-20 rounded bg-zinc-800 border border-zinc-700 px-1 py-1" />
              <button onClick={() => ownerAct(`/api/businesses/${detail.id}/products`, { itemId, priceKobo: Math.round(Number(price) * 100) }, "Price set.")} className="rounded border border-zinc-600 px-2 py-1">Set price</button>
              <input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="qty" className="w-14 rounded bg-zinc-800 border border-zinc-700 px-1 py-1" />
              <button onClick={() => ownerAct(`/api/businesses/${detail.id}/restock`, { itemId, qty: Number(qty) }, "Restocked from wholesaler.")} className="rounded border border-zinc-600 px-2 py-1">Restock</button>
            </div>
            <div className="flex gap-1 flex-wrap items-center">
              <input value={hireEmail} onChange={(e) => setHireEmail(e.target.value)} placeholder="hire by email" className="rounded bg-zinc-800 border border-zinc-700 px-1 py-1 flex-1 min-w-28" />
              <input value={wage} onChange={(e) => setWage(e.target.value)} placeholder="₦ wage" className="w-20 rounded bg-zinc-800 border border-zinc-700 px-1 py-1" />
              <button onClick={() => ownerAct(`/api/businesses/${detail.id}/hire`, { email: hireEmail, wageKobo: Math.round(Number(wage) * 100) }, "Hired.")} className="rounded border border-zinc-600 px-2 py-1">Hire</button>
              <button onClick={() => ownerAct(`/api/businesses/${detail.id}/work`, {}, "Shift paid.")} className="rounded border border-zinc-600 px-2 py-1">Work shift</button>
              <button onClick={() => ownerAct(`/api/businesses/${detail.id}/open`, { open: !detail.open }, detail.open ? "Closed." : "Opened.")} className="rounded border border-zinc-600 px-2 py-1">{detail.open ? "Close" : "Open"}</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {all.slice(0, 8).map((b) => (
            <div key={b.id} className="flex items-center gap-2 text-xs rounded-lg bg-zinc-900/60 px-2 py-1.5">
              <span>{b.name} <span className="text-zinc-500">({b.kind} · {b.zone} · {b.open ? "open" : "closed"})</span></span>
              <button onClick={() => openDetail(b.id)} className="ml-auto rounded border border-zinc-600 px-2 py-0.5">View</button>
            </div>
          ))}
          {all.length === 0 && <div className="text-xs text-zinc-500">No player businesses yet — open the first one above.</div>}
        </div>
      )}

      {msg && <div className="text-xs text-zinc-200">{msg}</div>}
    </div>
  );
}
