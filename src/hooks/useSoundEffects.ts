"use client";

import { useSharedSoundEffects } from "@/components/SoundContext";

interface SoundEffects {
  playHover: () => void;
  playClick: () => void;
  playSpecialClick: () => void;
}

export function useSoundEffects(): SoundEffects {
  return useSharedSoundEffects();
}
