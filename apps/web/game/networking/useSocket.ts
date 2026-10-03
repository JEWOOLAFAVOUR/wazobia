"use client";

import { useEffect, useRef, useState } from "react";
import { WS_URL } from "@/lib/api";

export type RemotePlayer = { userId: string; x: number; z: number; zone: string };

export function useSocket(userId: string, zone: string, posRef: React.MutableRefObject<{ x: number; z: number }>) {
  const [remotes, setRemotes] = useState<Map<string, RemotePlayer>>(new Map());
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}?userId=${encodeURIComponent(userId)}&zone=${encodeURIComponent(zone)}`);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "move" && msg.userId && msg.userId !== userId) {
          setRemotes((prev) => {
            const next = new Map(prev);
            next.set(msg.userId, { userId: msg.userId, x: msg.x, z: msg.z, zone: msg.zone ?? zone });
            return next;
          });
        }
      } catch {}
    };
    const tick = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "move", userId, x: posRef.current.x, z: posRef.current.z, zone }));
      }
    }, 100);
    return () => {
      clearInterval(tick);
      ws.close();
    };
  }, [userId, zone, posRef]);

  return { remotes, connected };
}
