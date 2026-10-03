"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { saveAvatar } from "@/game/entry/avatarStore";
import { CHARACTERS } from "@/game/character/characters";
import { EYE_COLORS, HAIR_COLORS, SKIN_TONES } from "@/game/character/appearance";
import { HAIR_STYLES } from "@/game/character/wardrobe";
import {
  BOTTOM_COLORS,
  BOTTOM_LABELS,
  CLOTH_COLORS,
  DEFAULT_AVATAR,
  SHOE_COLORS,
  SHOE_LABELS,
  SITUATIONS,
  TOP_COLORS,
  TOP_LABELS,
  type Avatar,
  type BottomId,
  type ShoeId,
  type TopId,
} from "@/game/character/wardrobe";

const CharacterViewer = dynamic(() => import("@/game/character/CharacterViewer"), {
  ssr: false,
  loading: () => <div className="text-sm text-stone-500">Preparing your character…</div>,
});

const STEPS = ["Body", "Top", "Bottoms", "Shoes", "Extras", "You", "Review"] as const;
type Step = (typeof STEPS)[number];

function Dots({
  options,
  value,
  onPick,
  label,
}: {
  options: { id: string; label: string; swatch: string }[];
  value: string;
  onPick: (id: string) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-xs uppercase tracking-widest text-stone-500">{label}</span>
      <div className="flex gap-2.5" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.id}
            role="radio"
            aria-checked={o.id === value}
            title={o.label}
            aria-label={o.label}
            onClick={() => onPick(o.id)}
            className={`w-8 h-8 rounded-full transition-transform duration-150 ${
              o.id === value ? "ring-2 ring-stone-100 ring-offset-2 ring-offset-[#121110] scale-110" : "hover:scale-105"
            }`}
            style={{ backgroundColor: o.swatch }}
          />
        ))}
      </div>
    </div>
  );
}

function Pills<T extends string>({
  options,
  value,
  onPick,
  label,
}: {
  options: { id: T; label: string }[];
  value: T;
  onPick: (id: T) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-xs uppercase tracking-widest text-stone-500">{label}</span>
      <div className="flex gap-2 flex-wrap justify-center" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.id}
            role="radio"
            aria-checked={o.id === value}
            onClick={() => onPick(o.id)}
            className={`rounded-full px-5 py-2 text-sm transition-all duration-200 border ${
              o.id === value
                ? "bg-stone-100 text-stone-900 border-stone-100 font-semibold"
                : "border-stone-700 text-stone-300 hover:border-stone-500"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CreateCharacter() {
  const router = useRouter();
  const [avatar, setAvatar] = useState<Avatar>(DEFAULT_AVATAR);
  const [step, setStep] = useState<Step>("Body");
  const [fading, setFading] = useState(false);
  const [entered, setEntered] = useState(false);

  const patch = (p: Partial<Avatar>) => setAvatar((a) => ({ ...a, ...p }));
  const stepIndex = STEPS.indexOf(step);

  const switchBody = (id: Avatar["body"]) => {
    if (id === avatar.body || fading) return;
    setFading(true);
    window.setTimeout(() => {
      setAvatar((a) => ({
        ...a,
        body: id,
        bottom: a.bottom?.id === "skirt" && id === "male" ? { id: "trousers", color: "#201d1a" } : a.bottom,
      }));
      setFading(false);
    }, 180);
  };

  const topLabel = avatar.top ? TOP_LABELS[avatar.top.id] : "—";
  const bottomLabel = avatar.bottom ? BOTTOM_LABELS[avatar.bottom.id] : "—";
  const shoeLabel = avatar.shoes ? SHOE_LABELS[avatar.shoes.id] : "—";
  const skinLabel = SKIN_TONES.find((t) => t.id === avatar.skin)?.label ?? "";
  const hairLabel = HAIR_COLORS.find((h) => h.id === avatar.hair.color)?.label ?? "";
  const hairStyleLabel = HAIR_STYLES.find((h) => h.id === avatar.hair.style)?.label ?? "";
  const headLabel = avatar.headwear.id === "none" ? "—" : avatar.headwear.id === "cap" ? "Cap" : "Head wrap";
  const accLabel =
    avatar.accessory === "none" ? "—" : avatar.accessory === "glasses" ? "Glasses" : avatar.accessory === "watch" ? "Watch" : avatar.accessory === "backpack" ? "Backpack" : "Handbag";

  return (
    <div className="flex flex-col flex-1 items-center bg-[#121110] text-stone-200 font-sans">
      <header className="w-full max-w-3xl px-6 pt-6 flex items-center justify-between">
        <span className="text-sm font-semibold tracking-tight text-stone-100">Wazobia</span>
        <span className="text-xs text-stone-500">
          {step} · {stepIndex + 1} of {STEPS.length}
        </span>
      </header>

      <main className="w-full max-w-3xl px-6 pb-12 flex flex-col items-center gap-5">
        <div className="text-center mt-2">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-50">Create Your Character</h1>
          <p className="mt-1 text-sm text-stone-400">Drag to look around. Every change shows immediately.</p>
        </div>

        <div
          className="w-full h-[50vh] min-h-[340px] rounded-2xl transition-opacity duration-200 flex items-center justify-center"
          style={{
            opacity: fading ? 0 : 1,
            background: "radial-gradient(ellipse 60% 55% at 50% 42%, #292420 0%, #121110 72%)",
          }}
        >
          <div className="w-full h-full [&>div]:h-full">
            <CharacterViewer avatar={avatar} />
          </div>
        </div>

        <div className="flex gap-1.5" aria-hidden>
          {STEPS.map((s, i) => (
            <span key={s} className={`h-1 w-6 rounded-full ${i <= stepIndex ? "bg-amber-400" : "bg-stone-700"}`} />
          ))}
        </div>

        {step === "Body" && (
          <div className="flex flex-col items-center gap-4">
            <Pills
              label="Body"
              value={avatar.body}
              onPick={(id) => switchBody(id)}
              options={CHARACTERS.map((c) => ({ id: c.id, label: c.label }))}
            />
            <Dots label="Skin" value={avatar.skin} onPick={(id) => patch({ skin: id })} options={SKIN_TONES} />
            <div className="flex gap-6 flex-wrap justify-center">
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-xs uppercase tracking-widest text-stone-500">Hairstyle</span>
                <div className="flex gap-2 flex-wrap justify-center" role="radiogroup" aria-label="Hairstyle">
                  {HAIR_STYLES.filter((h) => h.bodies.includes(avatar.body)).map((h) => (
                    <button
                      key={h.id}
                      role="radio"
                      aria-checked={avatar.hair.style === h.id}
                      onClick={() => patch({ hair: { ...avatar.hair, style: h.id } })}
                      className={`rounded-full px-4 py-1.5 text-xs transition-all duration-200 border ${
                        avatar.hair.style === h.id
                          ? "bg-stone-100 text-stone-900 border-stone-100 font-semibold"
                          : "border-stone-700 text-stone-300 hover:border-stone-500"
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>
              <Dots label="Hair color" value={avatar.hair.color} onPick={(color) => patch({ hair: { ...avatar.hair, color } })} options={HAIR_COLORS} />
              <Dots
                label="Eyes"
                value={avatar.eyes}
                onPick={(id) => patch({ eyes: id })}
                options={EYE_COLORS}
              />
            </div>
            <p className="text-xs text-stone-600">
              Official Quaternius cuts — more in the Source tier
            </p>
          </div>
        )}

        {step === "Top" && (
          <div className="flex flex-col items-center gap-4">
            <Pills
              label="Top"
              value={avatar.top?.id ?? "tee"}
              onPick={(id: TopId) => patch({ top: { id, color: avatar.top?.color ?? TOP_COLORS[0] } })}
              options={(Object.keys(TOP_LABELS) as TopId[]).map((id) => ({ id, label: TOP_LABELS[id] }))}
            />
            {avatar.top?.id === "sporttee" ? (
              <p className="text-xs text-stone-500">Poly by Google design · CC-BY — as designed</p>
            ) : (
              <Dots
                label="Color"
                value={avatar.top?.color ?? TOP_COLORS[0]}
                onPick={(color) => avatar.top && patch({ top: { ...avatar.top, color } })}
                options={TOP_COLORS.map((c) => ({ id: c, label: c, swatch: c }))}
              />
            )}
          </div>
        )}

        {step === "Bottoms" && (
          <div className="flex flex-col items-center gap-4">
            <Pills
              label="Bottoms"
              value={avatar.bottom?.id ?? "trousers"}
              onPick={(id: BottomId) => {
                if (id === "skirt" && avatar.body === "male") return;
                patch({ bottom: { id, color: avatar.bottom?.color ?? BOTTOM_COLORS[0] } });
              }}
              options={(Object.keys(BOTTOM_LABELS) as BottomId[])
                .filter((id) => id !== "skirt" || avatar.body === "female")
                .map((id) => ({ id, label: BOTTOM_LABELS[id] }))}
            />
            <Dots
              label="Color"
              value={avatar.bottom?.color ?? BOTTOM_COLORS[0]}
              onPick={(color) => avatar.bottom && patch({ bottom: { ...avatar.bottom, color } })}
              options={BOTTOM_COLORS.map((c) => ({ id: c, label: c, swatch: c }))}
            />
          </div>
        )}

        {step === "Shoes" && (
          <div className="flex flex-col items-center gap-4">
            <Pills
              label="Shoes"
              value={avatar.shoes?.id ?? "sneakers"}
              onPick={(id: ShoeId) => patch({ shoes: { id, color: avatar.shoes?.color ?? SHOE_COLORS[0] } })}
              options={(Object.keys(SHOE_LABELS) as ShoeId[]).map((id) => ({ id, label: SHOE_LABELS[id] }))}
            />
            <Dots
              label="Color"
              value={avatar.shoes?.color ?? SHOE_COLORS[0]}
              onPick={(color) => avatar.shoes && patch({ shoes: { ...avatar.shoes, color } })}
              options={SHOE_COLORS.map((c) => ({ id: c, label: c, swatch: c }))}
            />
          </div>
        )}

        {step === "Extras" && (
          <div className="flex flex-col items-center gap-4">
            <Pills
              label="Headwear"
              value={avatar.headwear.id}
              onPick={(id) => patch({ headwear: { id, color: avatar.headwear.color } })}
              options={[
                { id: "none" as const, label: "None" },
                { id: "cap" as const, label: "Cap" },
                { id: "wrap" as const, label: "Head wrap" },
              ]}
            />
            {avatar.headwear.id !== "none" && (
              <Dots
                label="Headwear color"
                value={avatar.headwear.color}
                onPick={(color) => patch({ headwear: { ...avatar.headwear, color } })}
                options={CLOTH_COLORS.map((c) => ({ id: c, label: c, swatch: c }))}
              />
            )}
            <Pills
              label="Accessory"
              value={avatar.accessory}
              onPick={(accessory) => patch({ accessory })}
              options={[
                { id: "none" as const, label: "None" },
                { id: "glasses" as const, label: "Glasses" },
                { id: "watch" as const, label: "Watch" },
                { id: "backpack" as const, label: "Backpack" },
                { id: "handbag" as const, label: "Handbag" },
              ]}
            />
          </div>
        )}

        {step === "You" && (
          <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            <label className="flex flex-col items-center gap-1.5 w-full">
              <span className="text-xs uppercase tracking-widest text-stone-500">What&apos;s your name?</span>
              <input
                value={avatar.name}
                onChange={(e) => patch({ name: e.target.value.slice(0, 24) })}
                placeholder="Favour"
                className="w-full rounded-xl bg-stone-900 border border-stone-700 px-4 py-2.5 text-center outline-none focus:border-amber-400 text-stone-100"
              />
            </label>
            <Pills
              label="What's your situation?"
              value={avatar.situation}
              onPick={(situation) => patch({ situation })}
              options={[{ id: "", label: "Skip" }, ...SITUATIONS.map((s) => ({ id: s, label: s }))]}
            />
          </div>
        )}

        {step === "Review" && (
          <div className="flex flex-col items-center gap-3 text-sm">
            <div className="text-center">
              <div className="text-xs uppercase tracking-widest text-stone-500">Your character</div>
              <div className="text-xl font-semibold text-stone-50 mt-1">{avatar.name || "Unnamed"}</div>
              {avatar.situation && <div className="text-stone-400">{avatar.situation}</div>}
            </div>
            <div className="text-stone-400 text-center leading-relaxed">
              {skinLabel} skin · {hairStyleLabel}, {hairLabel} hair
              <br />
              {topLabel} · {bottomLabel} · {shoeLabel}
              <br />
              {headLabel !== "—" || accLabel !== "—"
                ? `${[headLabel, accLabel].filter((x) => x !== "—").join(" · ")}`
                : "No extras"}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mt-1">
          {stepIndex > 0 && (
            <button
              onClick={() => setStep(STEPS[stepIndex - 1])}
              className="rounded-full border border-stone-700 px-8 py-2.5 text-sm text-stone-300 hover:border-stone-500 transition-colors"
            >
              Back
            </button>
          )}
          {step !== "Review" ? (
            <button
              onClick={() => setStep(STEPS[stepIndex + 1])}
              className="rounded-full bg-amber-400 text-black font-semibold px-10 py-2.5 text-sm hover:bg-amber-300 transition-colors"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={() => {
                saveAvatar(avatar);
                setEntered(true);
                router.push("/enter");
              }}
              className="rounded-full bg-amber-400 text-black font-semibold px-10 py-2.5 text-sm hover:bg-amber-300 transition-colors"
            >
              Enter Lagos
            </button>
          )}
        </div>
        {entered && (
          <p className="text-sm text-stone-400 text-center">
            Welcome{avatar.name ? `, ${avatar.name}` : ""} — the city itself arrives in the next phase.
          </p>
        )}
      </main>
    </div>
  );
}
