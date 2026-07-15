"use client";

import { useState, useEffect, useCallback } from "react";

const phrases = [
  "setting the mood",
  "dimming the lights",
  "cueing the record",
  "pouring a drink",
  "almost there",
];

const LOAD_MS = 16000;

export default function LoadingScreen({
  children,
}: {
  children: React.ReactNode;
}) {
  const [phase, setPhase] = useState<"prompt" | "loading" | "flash" | "done">("prompt");
  const [phraseIndex, setPhraseIndex] = useState(0);

  const start = () => setPhase("loading");

  const finish = useCallback(() => {
    setPhase("flash");
    setTimeout(() => setPhase("done"), 900);
  }, []);

  useEffect(() => {
    if (phase !== "loading") return;
    const timer = setTimeout(finish, LOAD_MS);
    return () => clearTimeout(timer);
  }, [phase, finish]);

  useEffect(() => {
    if (phase !== "loading") return;
    const interval = setInterval(
      () => setPhraseIndex((i) => (i + 1) % phrases.length),
      LOAD_MS / phrases.length,
    );
    return () => clearInterval(interval);
  }, [phase]);

  if (phase === "done") return <>{children}</>;

  return (
    <>
      <div className="contents invisible">{children}</div>

      <div
        onClick={phase === "prompt" ? start : undefined}
        className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-dusk-bg transition-opacity duration-[900ms] ease-in-out ${
          phase === "prompt" ? "cursor-pointer" : ""
        } ${phase === "flash" ? "opacity-0" : "opacity-100"}`}
      >
        {/* soft drifting club light */}
        <div
          className="absolute left-1/2 top-1/2 h-[80vmax] w-[80vmax] -translate-x-1/2 -translate-y-1/2 animate-dusk-drift rounded-full blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, rgba(240,168,104,0.28) 0%, rgba(224,137,154,0.14) 45%, transparent 70%)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-[70vmax] w-[70vmax] -translate-x-1/2 -translate-y-1/2 animate-dusk-drift-2 rounded-full blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, rgba(183,156,224,0.22) 0%, rgba(183,156,224,0.08) 50%, transparent 72%)",
          }}
        />

        {/* subtle film grain */}
        <div className="noise-overlay" style={{ opacity: 0.04 }} />

        {/* gentle vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at center, transparent 40%, rgba(16,11,22,0.7) 100%)",
          }}
        />

        <div className="relative flex flex-col items-center">
          {phase === "prompt" && (
            <div className="flex flex-col items-center gap-10 animate-soft-rise">
              <button
                aria-label="Enter"
                className="group relative flex h-24 w-24 items-center justify-center"
              >
                <span className="absolute inset-0 animate-soft-glow rounded-full bg-dusk-amber/20 blur-2xl" />
                <span className="absolute inset-0 rounded-full border border-dusk-amber/30 transition-all duration-700 group-hover:scale-110 group-hover:border-dusk-amber/60" />
                <span
                  className="relative ml-1 block h-0 w-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-dusk-amber/70 transition-colors duration-500 group-hover:border-l-dusk-amber"
                />
              </button>
              <span className="font-mono text-[11px] uppercase tracking-[0.5em] text-dusk-muted/70">
                press to enter
              </span>
            </div>
          )}

          {phase === "loading" && (
            <div className="flex flex-col items-center gap-12">
              {/* breathing core */}
              <div className="relative flex h-16 w-16 items-center justify-center">
                <span className="absolute inset-0 animate-soft-glow rounded-full bg-dusk-amber/25 blur-xl" />
                <span className="h-2.5 w-2.5 animate-soft-glow rounded-full bg-dusk-amber/80" />
              </div>

              <div className="flex h-6 items-center justify-center">
                <span
                  key={phraseIndex}
                  className="animate-soft-rise font-serif text-xl italic tracking-wide text-dusk-rose/80"
                >
                  {phrases[phraseIndex]}
                </span>
              </div>

              {/* minimalist progress line */}
              <div className="h-[1px] w-48 overflow-hidden bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-dusk-amber/60 via-dusk-rose/60 to-dusk-violet/60"
                  style={{
                    animation: `progressFill ${LOAD_MS}ms linear forwards`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
