"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { saveAvatar } from "@/game/entry/avatarStore";
import { SKIN_TONES } from "@/game/character/appearance";
import {
  DEFAULT_AVATAR,
  FABRICS,
  HAIR_CUTS,
  OUTFITS,
  type Avatar,
  type OutfitId,
} from "@/game/character/wardrobe";

const CharacterViewer = dynamic(() => import("@/game/character/CharacterViewer"), {
  ssr: false,
  loading: () => <div className="text-sm text-slate-400">Preparing your character…</div>,
});

function applyOutfit(outfit: OutfitId, body: Avatar["body"], topColor: string): Pick<Avatar, "top" | "bottom" | "shoes"> {
  switch (outfit) {
    case "office":
      return {
        top: { id: "shirt", color: topColor },
        bottom: { id: "trousers", color: "#2b2b30" },
        shoes: { id: "leather", color: "#5a3a24" },
      };
    case "owambe":
      return {
        top: { id: "native", color: topColor },
        bottom: body === "female" ? { id: "skirt", color: "#1d1d22" } : { id: "trousers", color: "#201d1a" },
        shoes: { id: "leather", color: "#241a12" },
      };
    case "sitework":
      return {
        top: { id: "longsleeve", color: "#7a7448" },
        bottom: { id: "trousers", color: "#3d3a45" },
        shoes: { id: "sneakers", color: "#eceae6" },
      };
    case "casual":
    default:
      return {
        top: { id: "tee", color: topColor },
        bottom: { id: "jeans", color: "#2f4a6b" },
        shoes: { id: "sneakers", color: "#eceae6" },
      };
  }
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
        selected ? "bg-slate-900 text-white font-semibold" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-medium text-slate-500 mt-3 mb-1 first:mt-0">{children}</div>;
}

export default function CreateCharacter() {
  const [avatar, setAvatar] = useState<Avatar>(DEFAULT_AVATAR);
  const [step, setStep] = useState<"account" | "avatar">("account");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const router = useRouter();

  const patch = (p: Partial<Avatar>) => setAvatar((a) => ({ ...a, ...p }));
  const fabricTop = FABRICS.find((f) => f.id === avatar.fabric)?.top ?? avatar.top?.color ?? "#2e6b46";

  const pickOutfit = (outfit: OutfitId) => {
    patch({ outfit, ...applyOutfit(outfit, avatar.body, fabricTop) });
  };

  const pickFabric = (id: string) => {
    const top = FABRICS.find((f) => f.id === id)?.top ?? fabricTop;
    patch({ fabric: id, top: avatar.top ? { ...avatar.top, color: top } : avatar.top });
  };

  const pickBody = (body: Avatar["body"]) => {
    patch({ body, ...applyOutfit(avatar.outfit, body, fabricTop) });
  };

  const shuffle = () => {
    const bodies: Avatar["body"][] = ["female", "male"];
    const body = bodies[Math.floor(Math.random() * bodies.length)];
    const hairPool = HAIR_CUTS.filter((h) => h.bodies.includes(body));
    const hair = hairPool[Math.floor(Math.random() * hairPool.length)];
    const skins = SKIN_TONES.map((s) => s.id);
    const outfits: OutfitId[] = ["casual", "office", "owambe", "sitework"];
    const outfit = outfits[Math.floor(Math.random() * outfits.length)];
    const fabric = FABRICS[Math.floor(Math.random() * FABRICS.length)].id;
    const top = FABRICS.find((f) => f.id === fabric)?.top ?? "#2e6b46";
    patch({ body, skin: skins[Math.floor(Math.random() * skins.length)], hair: { ...avatar.hair, cut: hair.id }, outfit, fabric, ...applyOutfit(outfit, body, top) });
  };

  const enter = () => {
    saveAvatar(avatar);
    router.push("/enter");
  };

  const continueToAvatar = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAvatar((current) => ({ ...current, name: username.trim() }));
    setStep("avatar");
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col font-sans text-slate-800 bg-gradient-to-b from-[#dde5ed] via-[#eceff2] to-[#f5f3ee]">
      {/* top bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 pt-2 pb-1">
        {step === "account" ? <span className="w-10" aria-hidden /> : (
          <button
            onClick={() => setStep("account")}
            aria-label="Back to account details"
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-xl text-slate-700 hover:bg-slate-50"
          >
            ‹
          </button>
        )}
        <div className="flex flex-col items-center gap-1.5">
          <span className="font-bold text-lg tracking-tight">{step === "account" ? "Join Wazobia" : "Look"}</span>
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-1.5 w-8 rounded-full bg-emerald-500" />
            <span className={`h-1.5 w-8 rounded-full ${step === "avatar" ? "bg-emerald-500" : "bg-slate-300"}`} />
          </div>
        </div>
        {step === "avatar" ? (
          <div className="flex items-center gap-2">
            <button
              onClick={shuffle}
              aria-label="Shuffle"
              className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-lg text-slate-700 hover:bg-slate-50"
            >
              ⇄
            </button>
            <button
              onClick={enter}
              className="h-10 px-5 rounded-full bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
            >
              Next
            </button>
          </div>
        ) : (
          <span className="w-10" aria-hidden />
        )}
      </header>

      {/* main */}
      {step === "account" ? (
        <main className="flex-1 min-h-0 flex items-center justify-center px-4 pb-6">
          <form onSubmit={continueToAvatar} className="w-full max-w-md rounded-[28px] bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Step 1 of 2</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
              <p className="mt-1 text-sm text-slate-500">Choose your details, then make your character.</p>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                Username
                <input
                  name="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  minLength={3}
                  maxLength={24}
                  pattern="[A-Za-z0-9_]{3,24}"
                  title="Use 3–24 letters, numbers, or underscores."
                  autoComplete="username"
                  placeholder="e.g. lagosstar"
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 font-normal outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                Password
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 font-normal outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                Email <span className="font-normal text-slate-400">Optional</span>
                <input
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 font-normal outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>

            <label className="mt-5 flex items-start gap-2.5 text-sm leading-5 text-slate-600">
              <input
                type="checkbox"
                checked={acceptedPolicy}
                onChange={(event) => setAcceptedPolicy(event.target.checked)}
                required
                className="mt-0.5 h-4 w-4 accent-emerald-600"
              />
              <span>I agree to Wazobia&apos;s Terms of Service and Privacy Policy.</span>
            </label>

            <button
              type="submit"
              className="mt-6 h-12 w-full rounded-full bg-emerald-500 font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              Continue
            </button>
          </form>
        </main>
      ) : (
        <main className="flex-1 min-h-0 flex flex-col lg:flex-row items-stretch gap-3 px-4 sm:px-6 pb-3 pt-1 max-w-[1500px] w-full mx-auto">
          {/* stage */}
          <div className="flex-1 flex flex-col items-center justify-start min-h-0 pt-4 lg:pt-8">
            <div className="w-full max-w-[34rem] h-[42vh] lg:h-[68vh] max-h-[68vh] [&>div]:h-full">
              <CharacterViewer avatar={avatar} />
            </div>
            <span className="text-[11px] text-slate-400 -mt-1">drag to spin</span>
          </div>

          {/* panel */}
          <aside className="w-full lg:w-[560px] shrink-0 bg-white rounded-[28px] shadow-[0_8px_30px_rgba(15,23,42,0.08)] p-4 flex flex-col max-h-[calc(100vh-104px)] overflow-hidden">
            <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-2 bg-slate-100 rounded-full pl-4 pr-2 py-2">
              <span className="font-bold text-slate-800 text-sm">@{avatar.name.trim() ? avatar.name.trim().toLowerCase().replace(/\s+/g, "_") : "you"}</span>
              <input
                value={avatar.name}
                onChange={(e) => patch({ name: e.target.value.slice(0, 24) })}
                placeholder="your Sim's name"
                className="flex-1 min-w-0 bg-transparent text-right text-sm text-slate-500 placeholder:text-slate-400 outline-none"
              />
            </div>

            <Label>Body</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["female", "male"] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => pickBody(b)}
                  className={`rounded-full py-2 text-sm transition-colors ${
                    avatar.body === b ? "bg-slate-900 text-white font-semibold" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {b === "female" ? "Woman" : "Man"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-slate-400">Skin</span>
              {SKIN_TONES.map((t) => (
                <button
                  key={t.id}
                  title={t.label}
                  aria-label={t.label}
                  onClick={() => patch({ skin: t.id })}
                  className={`w-7 h-7 rounded-full ${avatar.skin === t.id ? "ring-2 ring-slate-900 ring-offset-2" : ""}`}
                  style={{ backgroundColor: t.swatch }}
                />
              ))}
            </div>

            <Label>Hairstyle</Label>
            <div className="flex flex-wrap gap-2">
              {HAIR_CUTS.filter((h) => h.bodies.includes(avatar.body)).map((h) => (
                <Chip key={h.id} selected={avatar.hair.cut === h.id} onClick={() => patch({ hair: { ...avatar.hair, cut: h.id } })}>
                  {h.label}
                </Chip>
              ))}
            </div>

            <Label>Outfit</Label>
            <div className="flex flex-wrap gap-2">
              {OUTFITS.map((o) => (
                <Chip key={o.id} selected={avatar.outfit === o.id} onClick={() => pickOutfit(o.id)}>
                  {o.label}
                </Chip>
              ))}
            </div>

            <Label>Fabric</Label>
            <div className="flex flex-wrap gap-2">
              {FABRICS.map((f) => (
                <button
                  key={f.id}
                  title={f.label}
                  aria-label={f.label}
                  onClick={() => pickFabric(f.id)}
                  className={`h-8 px-3 rounded-full text-sm flex items-center gap-2 ${
                    avatar.fabric === f.id ? "bg-slate-900 text-white font-semibold" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: f.swatch }} />
                  {f.label}
                </button>
              ))}
            </div>

            <Label>Extras</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "none" as const, label: "None" },
                { id: "cap" as const, label: "Cap" },
                { id: "wrap" as const, label: "Head wrap" },
                { id: "glasses" as const, label: "Glasses" },
                { id: "backpack" as const, label: "Backpack" },
              ].map((o) => (
                <Chip
                  key={o.id}
                  selected={o.id === "none" ? avatar.headwear.id === "none" && avatar.accessory === "none" : avatar.headwear.id === o.id || avatar.accessory === o.id}
                  onClick={() => {
                    if (o.id === "none") patch({ headwear: { ...avatar.headwear, id: "none" }, accessory: "none" });
                    else if (o.id === "cap" || o.id === "wrap") patch({ headwear: { ...avatar.headwear, id: o.id } });
                    else patch({ accessory: o.id });
                  }}
                >
                  {o.label}
                </Chip>
              ))}
            </div>
            </div>

            <button
              onClick={enter}
              className="mt-3 w-full py-3 rounded-full bg-emerald-500 text-white font-semibold text-base hover:bg-emerald-600 transition-colors"
            >
              Continue
            </button>
          </aside>
        </main>
      )}
    </div>
  );
}
