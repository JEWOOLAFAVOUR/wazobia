"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type Me = { userId: string; email: string; displayName: string };

export default function AuthBox({ onAuth }: { onAuth?: () => void }) {
  const [me, setMe] = useState<Me | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  const refresh = useCallback(() => {
    api<Me>("/api/me")
      .then((m) => { setMe(m); onAuth?.(); })
      .catch(() => setMe(null));
  }, [onAuth]);
  useEffect(() => { refresh(); }, [refresh]);

  const submit = async (mode: "register" | "login") => {
    setErr("");
    try {
      if (mode === "register") {
        await api("/api/auth/register", { method: "POST", body: JSON.stringify({ email, password, displayName: name || email.split("@")[0] }) });
      } else {
        await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      }
      setPassword("");
      refresh();
    } catch {
      setErr(mode === "register" ? "Register failed (email taken? password min 8?)" : "Login failed — check credentials.");
    }
  };

  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    setMe(null);
    onAuth?.();
  };

  if (me) {
    return (
      <div className="rounded-xl border border-zinc-800 p-3 text-sm bg-black/40 flex items-center gap-2">
        <span>👤 <b>{me.displayName || me.email}</b></span>
        <button onClick={logout} className="ml-auto text-xs text-zinc-400 hover:text-white">log out</button>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-zinc-800 p-3 text-sm bg-black/40 flex flex-col gap-2">
      <div className="font-semibold">Enter Wazobia <span className="text-zinc-500 font-normal">(₦50,000 starter)</span></div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" className="rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 outline-none focus:border-amber-400" />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 outline-none focus:border-amber-400" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password (min 8)" className="rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 outline-none focus:border-amber-400" />
      {err && <div className="text-red-400 text-xs">{err}</div>}
      <div className="flex gap-2">
        <button onClick={() => submit("register")} className="flex-1 rounded-lg bg-amber-400 text-black font-bold px-3 py-1.5">Register</button>
        <button onClick={() => submit("login")} className="flex-1 rounded-lg border border-zinc-600 px-3 py-1.5">Log in</button>
      </div>
    </div>
  );
}
