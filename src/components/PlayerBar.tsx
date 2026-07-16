"use client";

import { useSyncExternalStore } from "react";
import { useMusic } from "./MusicContext";
import { useSoundEffects } from "@/hooks/useSoundEffects";

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

const subscribeToBrowser = () => () => {};

export default function PlayerBar() {
  const isHydrated = useSyncExternalStore(
    subscribeToBrowser,
    () => true,
    () => false,
  );
  const {
    isPlaying,
    currentTime,
    duration,
    musicEnabled,
    togglePlayback,
    seekTo,
    skipBy,
  } = useMusic();
  const { playHover, playClick } = useSoundEffects();
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const runControl = (action: () => void | Promise<void>) => {
    playClick();
    void action();
  };

  return (
    <footer
      className={`player-bar animate-site-chrome fixed inset-x-0 bottom-0 z-20 border-t border-ac-steel/70 bg-ac-ink/95 transition-[transform,opacity] duration-700 ease-out ${
        musicEnabled
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0"
      }`}
      aria-hidden={!musicEnabled}
    >
      <div className="flex items-center gap-2 px-2 py-1.5 font-mono text-[10px] text-ac-ash sm:gap-4 sm:px-6 sm:py-2.5">
        <div className="flex items-center text-ac-fog sm:gap-1">
          <button
            type="button"
            aria-label="Rewind 10 seconds"
            tabIndex={musicEnabled ? 0 : -1}
            onMouseEnter={playHover}
            onClick={() => runControl(() => skipBy(-10))}
            className="grid min-h-11 min-w-11 place-items-center transition-colors hover:text-ac-halo focus-visible:outline focus-visible:outline-1 focus-visible:outline-ac-frost"
          >
            ◄◄
          </button>
          <button
            type="button"
            aria-label={isPlaying ? "Pause background music" : "Play background music"}
            tabIndex={musicEnabled ? 0 : -1}
            onMouseEnter={playHover}
            onClick={() => runControl(togglePlayback)}
            className="grid min-h-11 min-w-11 place-items-center text-ac-frost transition-colors hover:text-ac-halo focus-visible:outline focus-visible:outline-1 focus-visible:outline-ac-frost"
          >
            {isPlaying ? "▐▐" : "►"}
          </button>
          <button
            type="button"
            aria-label="Forward 10 seconds"
            tabIndex={musicEnabled ? 0 : -1}
            onMouseEnter={playHover}
            onClick={() => runControl(() => skipBy(10))}
            className="grid min-h-11 min-w-11 place-items-center transition-colors hover:text-ac-halo focus-visible:outline focus-visible:outline-1 focus-visible:outline-ac-frost"
          >
            ►►
          </button>
        </div>
        <span className="hidden tabular-nums text-ac-frost sm:inline">{formatTime(currentTime)}</span>
        <div className="relative h-[3px] flex-1 bg-ac-steel/60">
          <div
            className="absolute inset-0 origin-left bg-ac-fog/70 transition-transform duration-100"
            style={{ transform: `scaleX(${progress / 100})` }}
          />
          <div
            className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-ac-frost"
            style={{ left: `${progress}%` }}
          />
          {isHydrated && (
            <input
              type="range"
              aria-label="Background music position"
              min="0"
              max={duration || 1}
              step="0.1"
              value={Math.min(currentTime, duration || 1)}
              disabled={!musicEnabled || duration <= 0}
              onInput={(event) => seekTo(Number(event.currentTarget.value))}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
            />
          )}
        </div>
        <span className="hidden tabular-nums text-ac-ash sm:inline">{formatTime(duration)}</span>
        <span className="hidden uppercase tracking-[0.2em] sm:inline">stereo · 44.1khz</span>
        <span className="hidden uppercase tracking-[0.2em] sm:inline">loop ∞</span>
      </div>
    </footer>
  );
}
