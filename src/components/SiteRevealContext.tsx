"use client";

import { createContext, useContext, useMemo } from "react";

export type SiteRevealPhase =
  | "hidden"
  | "background"
  | "middle"
  | "flower"
  | "foreground"
  | "complete";

type AnimatedSiteRevealPhase = Exclude<
  SiteRevealPhase,
  "hidden" | "complete"
>;

type SiteRevealContextValue = {
  phase: SiteRevealPhase;
  completePhase: (phase: AnimatedSiteRevealPhase) => void;
  finishReveal: () => void;
};

const SiteRevealContext = createContext<SiteRevealContextValue>({
  phase: "complete",
  completePhase: () => {},
  finishReveal: () => {},
});

export function SiteRevealProvider({
  children,
  phase,
  completePhase,
  finishReveal,
}: {
  children: React.ReactNode;
  phase: SiteRevealPhase;
  completePhase: (phase: AnimatedSiteRevealPhase) => void;
  finishReveal: () => void;
}) {
  const value = useMemo(
    () => ({ phase, completePhase, finishReveal }),
    [completePhase, finishReveal, phase],
  );

  return (
    <SiteRevealContext.Provider value={value}>
      {children}
    </SiteRevealContext.Provider>
  );
}

export function useSiteReveal() {
  return useContext(SiteRevealContext).phase !== "hidden";
}

export function useSiteRevealPhase() {
  return useContext(SiteRevealContext).phase;
}

export function useSiteRevealControls() {
  const { completePhase, finishReveal } = useContext(SiteRevealContext);
  return { completePhase, finishReveal };
}
