"use client";

import { useCallback, useEffect, useState } from "react";
import { api, formatNaira } from "@/lib/api";

type Status = { energy: number; home: string; zone: string; balanceKobo: number; jobId: string | null; jobTitle: string | null };
type Job = { id: string; title: string; kind: string; payKobo: number; energyCost: number; cooldownSeconds: number; description: string };
type Home = { id: string; name: string; rentKobo: number; energyBonus: number; description: string };
type Clock = { day: number; phase: string; hour: number };
type InvItem = { itemId: string; qty: number; name: string };

const ZONES = ["zone-a", "zone-b", "zone-c", "zone-d"];

export default function LifePanel({ refreshKey, onMoney }: { refreshKey: number; onMoney?: () => void }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [homes, setHomes] = useState<Home[]>([]);
  const [clock, setClock] = useState<Clock | null>(null);
  const [inv, setInv] = useState<InvItem[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(() => {
    api<Status>("/api/life/status").then(setStatus).catch(() => setStatus(null));
    api<Job[]>("/api/jobs").then(setJobs).catch(() => {});
    api<Home[]>("/api/homes").then(setHomes).catch(() => {});
    api<Clock>("/api/world/clock").then(setClock).catch(() => {});
    api<{ inventory: InvItem[] }>("/api/wallet").then((w) => setInv(w.inventory ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const act = async (label: string, path: string, body: unknown) => {
    setMsg("");
    setBusy(label);
    try {
      const r = await api<{ newBalanceKobo?: number; newEnergy?: number; payKobo?: number; zone?: string; home?: string; retryAfterSecs?: number }>(path, {
        method: "POST",
        body: JSON.stringify(body),
      });
      const bits: string[] = [];
      if (r.payKobo) bits.push(`+${formatNaira(r.payKobo)}`);
      if (r.newBalanceKobo !== undefined) bits.push(`balance ${formatNaira(r.newBalanceKobo)}`);
      if (r.newEnergy !== undefined) bits.push(`energy ${r.newEnergy}`);
      if (r.zone) bits.push(`→ ${r.zone}`);
      if (r.home) bits.push(`home: ${r.home}`);
      setMsg(`${label}: ${bits.join(" · ") || "done"}`);
      load();
      onMoney?.();
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      if (m.includes("429")) setMsg(`${label}: shift cooling down — rest a bit.`);
      else if (m.includes("402")) setMsg(`${label}: insufficient funds.`);
      else if (m.includes("401")) setMsg(`${label}: log in first.`);
      else if (m.includes("409") || m.includes("404")) setMsg(`${label}: not possible right now (tired? out of stock?).`);
      else setMsg(`${label} failed — is the API online?`);
    } finally {
      setBusy("");
    }
  };

  const hire = (jobId: string) => act(`Hired`, "/api/jobs/hire", { jobId });

  if (!status) {
    return (
      <div className="rounded-xl border border-zinc-800 p-3 text-sm bg-black/40 text-zinc-400">
        Life status unavailable — log in to wake up in Yaba.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 p-3 text-sm bg-black/40 flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="font-semibold">Day {clock?.day ?? "–"} · {clock?.phase ?? "–"}</div>
        <div className="text-zinc-400">🏠 {status.home}</div>
        <div className="text-zinc-400">📍 {status.zone}</div>
        <div className="text-zinc-400">💼 {status.jobTitle ?? "no job"}</div>
        <div className="ml-auto flex items-center gap-2">
          <span>⚡</span>
          <div className="w-24 h-2 rounded bg-zinc-800 overflow-hidden">
            <div className="h-full bg-green-400" style={{ width: `${status.energy}%` }} />
          </div>
          <span className="text-zinc-300">{status.energy}</span>
        </div>
      </div>

      <div>
        <div className="font-semibold mb-1">Jobs</div>
        <div className="flex flex-col gap-1">
          {jobs.map((j) => (
            <div key={j.id} className="flex items-center gap-2 rounded-lg bg-zinc-900/60 px-2 py-1.5">
              <span>{j.title} <span className="text-zinc-500 text-xs">+{formatNaira(j.payKobo)} · -{j.energyCost}⚡ · {j.cooldownSeconds}s</span></span>
              <span className="ml-auto flex gap-1">
                <button disabled={status.jobId === j.id} onClick={() => hire(j.id)} className="rounded-lg border border-zinc-600 px-2 py-1 text-xs disabled:opacity-40">
                  {status.jobId === j.id ? "Hired" : "Take"}
                </button>
                <button disabled={busy === "Work" || status.jobId !== j.id} onClick={() => act("Work", "/api/jobs/work", {})} className="rounded-lg bg-amber-400 text-black font-bold px-2 py-1 text-xs disabled:opacity-40">
                  {busy === "Work" ? "…" : "Work"}
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="font-semibold mb-1">Food {inv.length > 0 && <span className="text-zinc-500 font-normal">(eat to restore ⚡)</span>}</div>
        {inv.length === 0 ? (
          <div className="text-xs text-zinc-500">Empty pockets — buy jollof or bread at a shop first.</div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {inv.map((f) => (
              <button key={f.itemId} onClick={() => act(`Ate ${f.name}`, "/api/inventory/eat", { itemId: f.itemId })} className="rounded-lg border border-zinc-700 px-2 py-1 text-xs hover:border-amber-400">
                Eat {f.name} ×{f.qty}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="font-semibold mb-1">Housing</div>
        <div className="flex flex-wrap gap-1">
          {homes.map((h) => (
            <button key={h.id} title={h.description} onClick={() => act(`Rent ${h.name}`, "/api/housing/rent", { homeId: h.id })} className="rounded-lg border border-zinc-700 px-2 py-1 text-xs hover:border-amber-400">
              {h.name} · {h.rentKobo === 0 ? "free" : formatNaira(h.rentKobo)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="font-semibold mb-1">Danfo · ₦300/ride</div>
        <div className="flex flex-wrap gap-1">
          {ZONES.map((z) => (
            <button key={z} disabled={status.zone === z} onClick={() => act("Ride", "/api/transport/ride", { toZone: z })} className="rounded-lg border border-zinc-700 px-2 py-1 text-xs disabled:opacity-40 hover:border-amber-400">
              {z === status.zone ? `● ${z}` : z}
            </button>
          ))}
        </div>
      </div>

      {msg && <div className="text-xs text-zinc-200">{msg}</div>}
    </div>
  );
}
