"use client";

import { useCallback, useEffect, useState } from "react";
import { api, formatNaira } from "@/lib/api";

type Person = { userId: string; displayName: string };
type Friends = { friends: Person[]; pendingIn: Person[]; pendingOut: Person[] };
type Org = { id: string; name: string; kind: string; description: string; members: number };
type OrgDetail = { id: string; name: string; kind: string; description: string; members: { userId: string; name: string; role: string }[] };
type Evt = { id: string; title: string; venue: string; startsAt: string; capacity: number; ticketKobo: number; going: number };

type Tab = "friends" | "orgs" | "events";

export default function SocialPanel({ refreshKey, onMoney }: { refreshKey: number; onMoney?: () => void }) {
  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<Friends>({ friends: [], pendingIn: [], pendingOut: [] });
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgDetail, setOrgDetail] = useState<OrgDetail | null>(null);
  const [events, setEvents] = useState<Evt[]>([]);
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgKind, setOrgKind] = useState("club");
  const [evTitle, setEvTitle] = useState("");
  const [evTicket, setEvTicket] = useState("5000");
  const [evCap, setEvCap] = useState("50");
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    api<Friends>("/api/friends").then(setFriends).catch(() => {});
    api<Org[]>("/api/orgs").then(setOrgs).catch(() => setOrgs([]));
    api<Evt[]>("/api/events").then(setEvents).catch(() => setEvents([]));
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const post = async (path: string, body: unknown, okMsg: string) => {
    setMsg("");
    try {
      await api(path, { method: "POST", body: JSON.stringify(body) });
      setMsg(okMsg);
      load();
      onMoney?.();
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      if (m.includes("401")) setMsg("Log in first.");
      else if (m.includes("404")) setMsg("Not found — check the email / id.");
      else if (m.includes("402")) setMsg("Insufficient funds for the ticket.");
      else if (m.includes("409")) setMsg("Event is full.");
      else setMsg("Action failed — is the API online?");
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 p-3 text-sm bg-black/40 flex flex-col gap-3">
      <div className="flex gap-2 items-center">
        {(["friends", "orgs", "events"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1 text-xs border capitalize ${tab === t ? "bg-amber-400 text-black border-amber-400 font-bold" : "border-zinc-700 text-zinc-300"}`}
          >
            {t}
          </button>
        ))}
        <span className="ml-auto text-xs text-zinc-500">{friends.friends.length} friends</span>
      </div>

      {tab === "friends" && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Friend's email" className="flex-1 rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 outline-none focus:border-amber-400" />
            <button onClick={() => post("/api/friends/request", { email }, "Request sent.")} className="rounded-lg bg-amber-400 text-black font-bold px-3 py-1.5">Add</button>
          </div>
          {friends.pendingIn.length > 0 && (
            <div className="flex flex-col gap-1">
              <div className="text-xs text-zinc-500">Requests for you</div>
              {friends.pendingIn.map((p) => (
                <div key={p.userId} className="flex items-center gap-2 rounded-lg bg-zinc-900/60 px-2 py-1.5 text-xs">
                  <span>{p.displayName}</span>
                  <span className="ml-auto flex gap-1">
                    <button onClick={() => post("/api/friends/accept", { userId: p.userId }, "Befriended.")} className="rounded bg-green-500 text-black font-bold px-2 py-0.5">Accept</button>
                    <button onClick={() => post("/api/friends/decline", { userId: p.userId }, "Declined.")} className="rounded border border-zinc-600 px-2 py-0.5">X</button>
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            {friends.friends.map((f) => (
              <span key={f.userId} className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs">👤 {f.displayName}</span>
            ))}
            {friends.friends.length === 0 && <span className="text-xs text-zinc-500">No friends yet — friendships grow through repeated interaction.</span>}
          </div>
          {friends.pendingOut.length > 0 && (
            <div className="text-xs text-zinc-500">Sent: {friends.pendingOut.map((p) => p.displayName).join(", ")}</div>
          )}
        </div>
      )}

      {tab === "orgs" && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 flex-wrap">
            <input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="New organization" className="flex-1 min-w-28 rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 outline-none focus:border-amber-400" />
            <select value={orgKind} onChange={(e) => setOrgKind(e.target.value)} className="rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1.5">
              <option value="club">Club</option>
              <option value="church">Church</option>
              <option value="mosque">Mosque</option>
              <option value="association">Association</option>
              <option value="business">Business</option>
            </select>
            <button onClick={() => post("/api/orgs", { name: orgName, kind: orgKind }, "Organization founded.")} className="rounded-lg bg-amber-400 text-black font-bold px-3 py-1.5">Found</button>
          </div>
          {orgDetail ? (
            <div className="rounded-lg bg-zinc-900/60 p-2 text-xs">
              <div className="flex items-center gap-2"><b>{orgDetail.name}</b><span className="text-zinc-500">{orgDetail.kind}</span>
                <button onClick={() => setOrgDetail(null)} className="ml-auto text-zinc-400">close</button></div>
              <div className="flex flex-wrap gap-1 mt-1">
                {orgDetail.members.map((m) => (
                  <span key={m.userId} className="rounded-full bg-zinc-800 px-2 py-0.5">{m.name} · {m.role}</span>
                ))}
              </div>
              <div className="flex gap-1 mt-2">
                <button onClick={() => post(`/api/orgs/${orgDetail.id}/join`, {}, "Joined.")} className="rounded border border-zinc-600 px-2 py-0.5">Join</button>
                <button onClick={() => post(`/api/orgs/${orgDetail.id}/leave`, {}, "Left.")} className="rounded border border-zinc-600 px-2 py-0.5">Leave</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {orgs.map((o) => (
                <div key={o.id} className="flex items-center gap-2 rounded-lg bg-zinc-900/60 px-2 py-1.5 text-xs">
                  <span>{o.name} <span className="text-zinc-500">({o.kind} · {o.members})</span></span>
                  <span className="ml-auto flex gap-1">
                    <button onClick={() => api<OrgDetail>(`/api/orgs/${o.id}`).then(setOrgDetail).catch(() => {})} className="rounded border border-zinc-600 px-2 py-0.5">View</button>
                    <button onClick={() => post(`/api/orgs/${o.id}/join`, {}, `Joined ${o.name}.`)} className="rounded border border-zinc-600 px-2 py-0.5">Join</button>
                  </span>
                </div>
              ))}
              {orgs.length === 0 && <span className="text-xs text-zinc-500">No organizations yet — found the first club in Yaba.</span>}
            </div>
          )}
        </div>
      )}

      {tab === "events" && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 flex-wrap">
            <input value={evTitle} onChange={(e) => setEvTitle(e.target.value)} placeholder="Event title" className="flex-1 min-w-28 rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 outline-none focus:border-amber-400" />
            <input value={evTicket} onChange={(e) => setEvTicket(e.target.value)} placeholder="₦ ticket" className="w-20 rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1.5" />
            <input value={evCap} onChange={(e) => setEvCap(e.target.value)} placeholder="cap" className="w-14 rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1.5" />
            <button onClick={() => post("/api/events", { title: evTitle, venue: "yaba", ticketKobo: Math.round(Number(evTicket) * 100), capacity: Number(evCap) }, "Event created — you are on the list.")} className="rounded-lg bg-amber-400 text-black font-bold px-3 py-1.5">Host</button>
          </div>
          <div className="flex flex-col gap-1">
            {events.map((e) => (
              <div key={e.id} className="flex items-center gap-2 rounded-lg bg-zinc-900/60 px-2 py-1.5 text-xs">
                <span>{e.title} <span className="text-zinc-500">({e.venue} · {e.going}/{e.capacity} · {e.ticketKobo === 0 ? "free" : formatNaira(e.ticketKobo)})</span></span>
                <button onClick={() => post(`/api/events/${e.id}/attend`, {}, e.ticketKobo === 0 ? "You are going." : `Ticket: ${formatNaira(e.ticketKobo)}. You are going.`)} className="ml-auto rounded bg-amber-400 text-black font-bold px-2 py-0.5">Attend</button>
              </div>
            ))}
            {events.length === 0 && <span className="text-xs text-zinc-500">Nothing upcoming — host the first concert, meetup or wedding.</span>}
          </div>
        </div>
      )}

      {msg && <div className="text-xs text-zinc-200">{msg}</div>}
    </div>
  );
}
