"use client";

import { useEffect, useState } from "react";
import { api, formatNaira } from "@/lib/api";

export type Clock = { day: number; phase: string; hour: number };
export type LifeStatus = { energy: number; home: string; zone: string; balanceKobo: number; jobTitle: string | null; displayName: string };
export type Presence = { userId: string; zone: string };

export function useCityStatus(authed: boolean, tick: number) {
  const [clock, setClock] = useState<Clock | null>(null);
  const [status, setStatus] = useState<LifeStatus | null>(null);
  const [online, setOnline] = useState(0);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!authed) return;
    let alive = true;
    const get = () => {
      api<Clock>("/api/world/clock").then((d) => {
        if (alive) setClock(d);
      }).catch(() => {});
      api<Presence[]>("/api/presence").then((p) => {
        if (alive) setOnline(p.length);
      }).catch(() => {});
      if (!authed) {
        if (alive) {
          setStatus(null);
          setBalance(null);
        }
        return;
      }
      api<LifeStatus>("/api/life/status")
        .then((s) => {
          if (!alive) return;
          setStatus(s);
          setBalance(s.balanceKobo);
        })
        .catch(() => {
          if (!alive) return;
          setStatus(null);
          setBalance(null);
        });
    };
    get();
    const t = setInterval(get, 15000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [authed, tick]);

  return { clock, status, online, balance, formatBalance: balance == null ? null : formatNaira(balance) };
}
