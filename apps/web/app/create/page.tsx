"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { CHARACTERS, type CharacterId } from "@/game/character/characters";
import { HAIR_COLORS, SKIN_TONES } from "@/game/character/appearance";

const CharacterViewer = dynamic(() => import("@/game/character/CharacterViewer"), {
  ssr: false,
  loading: () => <div className="text-sm text-stone-500">Preparing your character…</div>,
});

export default function CreateCharacter() {
  const [selected, setSelected] = useState<CharacterId>("male");
  const [skin, setSkin] = useState("deep");
  const [hair, setHair] = useState("black");
  const [fading, setFading] = useState(false);
  const [done, setDone] = useState(false);

  const select = (id: CharacterId) => {
    if (id === selected || fading) return;
    setFading(true);
    setDone(false);
    window.setTimeout(() => {
      setSelected(id);
      setFading(false);
    }, 180);
  };

  const current = CHARACTERS.find((c) => c.id === selected) ?? CHARACTERS[0];

  return (
    <div className="flex flex-col flex-1 items-center bg-[#121110] text-stone-200 font-sans">
      <header className="w-full max-w-3xl px-6 pt-6 flex items-center justify-between">
        <span className="text-sm font-semibold tracking-tight text-stone-100">Wazobia</span>
        <span className="text-xs text-stone-500">Create your person</span>
      </header>

      <main className="w-full max-w-3xl px-6 pb-12 flex flex-col items-center gap-5">
        <div className="text-center mt-4">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-50">Create Your Character</h1>
          <p className="mt-1 text-sm text-stone-400">This is who the city will know. Drag to look around.</p>
        </div>

        <div
          className="w-full h-[58vh] min-h-[380px] rounded-2xl transition-opacity duration-200 flex items-center justify-center"
          style={{
            opacity: fading ? 0 : 1,
            background: "radial-gradient(ellipse 60% 55% at 50% 42%, #292420 0%, #121110 72%)",
          }}
        >
          <div className="w-full h-full [&>div]:h-full">
            <CharacterViewer id={selected} skin={skin} hair={hair} />
          </div>
        </div>

        <div className="flex gap-2" role="radiogroup" aria-label="Base character">
          {CHARACTERS.map((c) => (
            <button
              key={c.id}
              role="radio"
              aria-checked={c.id === selected}
              onClick={() => select(c.id)}
              className={`rounded-full px-6 py-2 text-sm transition-all duration-200 border ${
                c.id === selected
                  ? "bg-stone-100 text-stone-900 border-stone-100 font-semibold"
                  : "border-stone-700 text-stone-300 hover:border-stone-500"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-stone-500 -mt-3">{current.sub} · Quaternius base</p>

        <div className="flex flex-col items-center gap-1.5">
          <span className="text-xs uppercase tracking-widest text-stone-500">Skin</span>
          <div className="flex gap-2.5" role="radiogroup" aria-label="Skin tone">
            {SKIN_TONES.map((t) => (
              <button
                key={t.id}
                role="radio"
                aria-checked={t.id === skin}
                title={t.label}
                aria-label={t.label}
                onClick={() => setSkin(t.id)}
                className={`w-8 h-8 rounded-full transition-transform duration-150 ${
                  t.id === skin ? "ring-2 ring-stone-100 ring-offset-2 ring-offset-[#121110] scale-110" : "hover:scale-105"
                }`}
                style={{ backgroundColor: t.swatch }}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <span className="text-xs uppercase tracking-widest text-stone-500">Hair</span>
          <div className="flex gap-2.5" role="radiogroup" aria-label="Hair color">
            {HAIR_COLORS.map((h) => (
              <button
                key={h.id}
                role="radio"
                aria-checked={h.id === hair}
                title={h.label}
                aria-label={h.label}
                onClick={() => setHair(h.id)}
                className={`w-8 h-8 rounded-full transition-transform duration-150 ${
                  h.id === hair ? "ring-2 ring-stone-100 ring-offset-2 ring-offset-[#121110] scale-110" : "hover:scale-105"
                }`}
                style={{ backgroundColor: h.swatch }}
              />
            ))}
          </div>
          <p className="text-xs text-stone-600">Pack-in cut · more styles need the Source tier</p>
        </div>

        <button
          onClick={() => setDone(true)}
          className="mt-1 rounded-full bg-amber-400 text-black font-semibold px-10 py-2.5 text-sm hover:bg-amber-300 transition-colors"
        >
          Continue
        </button>
        {done && (
          <p className="text-sm text-stone-400 text-center">
            Noted — {current.label} it is. Appearance and clothing arrive in the next step.
          </p>
        )}
      </main>
    </div>
  );
}
