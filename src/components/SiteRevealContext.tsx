"use client";

import { createContext, useContext } from "react";

const SiteRevealContext = createContext(true);

export function SiteRevealProvider({
  children,
  isRevealed,
}: {
  children: React.ReactNode;
  isRevealed: boolean;
}) {
  return (
    <SiteRevealContext.Provider value={isRevealed}>
      {children}
    </SiteRevealContext.Provider>
  );
}

export function useSiteReveal() {
  return useContext(SiteRevealContext);
}
