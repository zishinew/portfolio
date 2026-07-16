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
      className={`player-bar animate-site-chrome fixed bottom-3 left-1/2 z-20 w-[calc(100%-1.5rem)] max-w-[680px] -translate-x-1/2 rounded-full border border-white/70 bg-white/60 shadow-[0_8px_30px_rgba(51,66,77,0.16),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl backdrop-saturate-150 transition-[transform,opacity] duration-500 ease-out ${
        musicEnabled
          ? "translate-y-0 opacity-100"
          : "translate-y-[calc(100%+1rem)] opacity-0"
      }`}
      aria-hidden={!musicEnabled}
    >
      <div className="flex h-10 items-center gap-2 px-1.5 font-mono text-[9px] text-ac-ash sm:gap-3 sm:px-2">
        <div className="flex shrink-0 items-center gap-0.5 text-ac-fog">
          <button
            type="button"
            aria-label="Rewind 10 seconds"
            tabIndex={musicEnabled ? 0 : -1}
            onMouseEnter={playHover}
            onClick={() => runControl(() => skipBy(-10))}
            className="grid h-8 w-8 place-items-center rounded-full text-[8px] tracking-[-0.06em] transition-[color,background-color] hover:bg-white/70 hover:text-ac-halo focus-visible:outline focus-visible:outline-1 focus-visible:outline-ac-frost"
          >
            −10
          </button>
          <button
            type="button"
            aria-label={isPlaying ? "Pause background music" : "Play background music"}
            tabIndex={musicEnabled ? 0 : -1}
            onMouseEnter={playHover}
            onClick={() => runControl(togglePlayback)}
            className="grid h-8 w-8 place-items-center rounded-full bg-ac-frost text-[9px] text-ac-void shadow-[0_2px_8px_rgba(51,66,77,0.22)] transition-[background-color,transform] hover:scale-105 hover:bg-ac-halo focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ac-frost active:scale-95"
          >
            <span className={isPlaying ? "tracking-[-0.18em]" : "translate-x-px"}>
              {isPlaying ? "Ⅱ" : "▶"}
            </span>
          </button>
          <button
            type="button"
            aria-label="Forward 10 seconds"
            tabIndex={musicEnabled ? 0 : -1}
            onMouseEnter={playHover}
            onClick={() => runControl(() => skipBy(10))}
            className="grid h-8 w-8 place-items-center rounded-full text-[8px] tracking-[-0.06em] transition-[color,background-color] hover:bg-white/70 hover:text-ac-halo focus-visible:outline focus-visible:outline-1 focus-visible:outline-ac-frost"
          >
            +10
          </button>
        </div>
        <div className="group/timeline relative h-8 min-w-16 flex-1">
          <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 overflow-hidden rounded-full bg-ac-steel/45">
            <div
              className="h-full origin-left rounded-full bg-ac-frost/80 transition-transform duration-100"
              style={{ transform: `scaleX(${progress / 100})` }}
            />
          </div>
          <div
            className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ac-frost shadow-[0_1px_4px_rgba(51,66,77,0.3)] transition-transform group-hover/timeline:scale-125"
            style={{ left: `${Math.min(progress, 100)}%` }}
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
        <span className="hidden shrink-0 tabular-nums tracking-[-0.04em] text-ac-fog sm:inline">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-ac-steel/40 text-[11px] text-ac-fog" aria-label="Looping">
          ∞
        </span>
      </div>
    </footer>
  );
}
