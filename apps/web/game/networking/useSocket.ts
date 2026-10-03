"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WS_URL } from "@/lib/api";

export type RemotePlayer = { userId: string; x: number; z: number; zone: string };
export type ChatMsg = { from: string; scope: string; zone?: string; text: string; at: number };
export type Notice = { kind: "join" | "leave"; userId: string; at: number };

export function useSocket(userId: string, zone: string, posRef: React.MutableRefObject<{ x: number; z: number }>) {
  const [remotes, setRemotes] = useState<Map<string, RemotePlayer>>(new Map());
  const [connected, setConnected] = useState(false);
  const [chats, setChats] = useState<ChatMsg[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
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
        } else if (msg.type === "chat" && msg.text) {
          setChats((prev) => [...prev.slice(-99), { from: msg.from, scope: msg.scope ?? "zone", zone: msg.zone, text: String(msg.text).slice(0, 280), at: msg.at ?? Date.now() / 1000 }]);
        } else if ((msg.type === "join" || msg.type === "leave") && msg.userId) {
          if (msg.userId === userId) return;
          setNotices((prev) => [...prev.slice(-19), { kind: msg.type, userId: msg.userId, at: msg.at ?? Date.now() / 1000 }]);
          if (msg.type === "leave") {
            setRemotes((prev) => {
              const next = new Map(prev);
              next.delete(msg.userId);
              return next;
            });
          }
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

  const sendChat = useCallback((text: string, scope: "zone" | "global") => {
    const ws = wsRef.current;
    const clean = text.trim().slice(0, 280);
    if (!ws || ws.readyState !== WebSocket.OPEN || !clean) return false;
    ws.send(JSON.stringify({ type: "chat", scope, text: clean }));
    // Optimistic echo for sender (server also relays to others; sender gets zone echo too).
    if (scope === "zone") {
      setChats((prev) => [...prev.slice(-99), { from: `${userId} (you)`, scope, zone, text: clean, at: Date.now() / 1000 }]);
    } else {
      setChats((prev) => [...prev.slice(-99), { from: `${userId} (you)`, scope, text: clean, at: Date.now() / 1000 }]);
    }
    return true;
  }, [userId, zone]);

  return { remotes, connected, chats, notices, sendChat };
}
