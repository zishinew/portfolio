"use client";

import { useEffect } from "react";

const DISCLAIMER_DURATION_MS = 1750;

export default function OwnershipDisclaimer({
  onContinue,
}: {
  onContinue: () => void;
}) {
  useEffect(() => {
    const duration = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
      ? 1000
      : DISCLAIMER_DURATION_MS;
    const timer = window.setTimeout(onContinue, duration);
    return () => window.clearTimeout(timer);
  }, [onContinue]);

  return (
    <div
      className="ownership-disclaimer fixed inset-0 z-[100] grid place-items-center bg-ac-void px-6"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-md border-y border-ac-steel/70 py-7 text-center sm:py-9">
        <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.35em] text-ac-ash">
          original work / notice
        </p>
        <h2
          className="font-garamond text-xl font-medium lowercase leading-snug text-ac-halo sm:text-2xl"
        >
          all music and artwork on this site was made by me.
        </h2>
        <p className="mx-auto mt-3 max-w-sm font-mono text-[9px] uppercase leading-relaxed tracking-[0.16em] text-ac-fog sm:text-[10px]">
          please don&apos;t copy, reuse, or redistribute it without my permission.
        </p>
      </div>
    </div>
  );
}
