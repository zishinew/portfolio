"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CLICK_SOUND_SRC } from "@/lib/audio";

type SoundName = "hover" | "click" | "specialClick";

const soundSources = {
  hover: "/hoversound.wav",
  click: CLICK_SOUND_SRC,
  specialClick: "/specialclicksound.mp3",
} satisfies Record<SoundName, string>;

class SoundAudioPool {
  private audioElements: Record<SoundName, HTMLAudioElement> | null = null;

  prepare() {
    if (this.audioElements) {
      return;
    }

    this.audioElements = Object.fromEntries(
      Object.entries(soundSources).map(([name, src]) => {
        const audio = new Audio(src);
        audio.preload = "auto";
        audio.volume = 0.5;
        return [name, audio];
      }),
    ) as Record<SoundName, HTMLAudioElement>;
  }

  play(name: SoundName) {
    const audio = this.audioElements?.[name];
    if (!audio) {
      return;
    }

    audio.currentTime = 0;
    void audio.play().catch(() => {});
  }

  dispose() {
    if (!this.audioElements) {
      return;
    }

    Object.values(this.audioElements).forEach((audio) => audio.pause());
    this.audioElements = null;
  }
}

interface SoundContextType {
  soundEnabled: boolean;
  playHover: () => void;
  playClick: () => void;
  playSpecialClick: () => void;
}

const noop = () => {};

const SoundContext = createContext<SoundContextType>({
  soundEnabled: false,
  playHover: noop,
  playClick: noop,
  playSpecialClick: noop,
});

export function SoundProvider({ children, soundEnabled }: { children: ReactNode; soundEnabled: boolean }) {
  const [audioPool] = useState(() => new SoundAudioPool());

  useEffect(() => {
    if (!soundEnabled) {
      return;
    }

    audioPool.prepare();
    return () => audioPool.dispose();
  }, [audioPool, soundEnabled]);

  const play = useCallback((name: SoundName) => {
    if (!soundEnabled) {
      return;
    }

    audioPool.play(name);
  }, [audioPool, soundEnabled]);

  const playHover = useCallback(() => play("hover"), [play]);
  const playClick = useCallback(() => play("click"), [play]);
  const playSpecialClick = useCallback(
    () => play("specialClick"),
    [play],
  );
  const value = useMemo(
    () => ({ soundEnabled, playHover, playClick, playSpecialClick }),
    [playClick, playHover, playSpecialClick, soundEnabled],
  );

  return (
    <SoundContext.Provider value={value}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSoundEnabled() {
  return useContext(SoundContext).soundEnabled;
}

export function useSharedSoundEffects() {
  const { playHover, playClick, playSpecialClick } = useContext(SoundContext);
  return { playHover, playClick, playSpecialClick };
}
