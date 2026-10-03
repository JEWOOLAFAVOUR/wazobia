"use client";

export default function EntryTransition({ phase }: { phase: "fade" | "title" | "world" }) {
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-[#0d0c0a] transition-opacity duration-1000"
      style={{ opacity: phase === "world" ? 0 : 1, pointerEvents: phase === "world" ? "none" : "auto" }}
    >
      <div
        className="flex flex-col items-center gap-2 transition-opacity duration-700"
        style={{ opacity: phase === "title" ? 1 : 0 }}
      >
        <div className="text-xs tracking-[0.5em] text-amber-400/90">YABA</div>
        <div className="text-2xl font-semibold text-stone-100 tracking-wide">LAGOS</div>
        <div className="mt-3 text-sm text-stone-400">You&apos;re here.</div>
      </div>
    </div>
  );
}
