"use client";

import { useEffect, useState } from "react";
import { useMusic } from "@/components/MusicContext";

export interface AudioPreferences {
  musicEnabled: boolean;
  effectsEnabled: boolean;
}

interface AudioPreferencesPromptProps {
  onConfirm: (preferences: AudioPreferences) => void;
}

export default function AudioPreferencesPrompt({
  onConfirm,
}: AudioPreferencesPromptProps) {
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const { audioRef } = useMusic();

  useEffect(() => {
    const timer = window.setTimeout(() => setIsVisible(true), 180);
    return () => window.clearTimeout(timer);
  }, []);

  const handleConfirm = () => {
    setIsZooming(true);

    if (musicEnabled) {
      void audioRef.current?.play().catch(() => {});
    } else {
      audioRef.current?.pause();
    }

    window.setTimeout(
      () => onConfirm({ musicEnabled, effectsEnabled }),
      520,
    );
  };

  if (!isVisible) return null;

  return (
    <>
      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center bg-ac-void ${
          isZooming ? "animate-zoom-in" : ""
        }`}
      >
        <div className="relative w-[340px] animate-glitch-appear">
          <div className="border-2 border-ac-ash bg-ac-ink shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between bg-ac-frost px-2 py-1">
              <span className="font-pixel text-[11px] uppercase tracking-wider text-ac-void">
                Audio Preferences
              </span>
              <span className="font-pixel text-[10px] text-ac-void" aria-hidden="true">
                ··
              </span>
            </div>

            <div className="px-6 py-7">
              <p className="mb-5 font-pixel text-[12px] leading-relaxed text-ac-bone">
                Select audio channels:
              </p>

              <div className="mb-7 space-y-3">
                <label className="flex cursor-pointer items-center gap-3 font-pixel text-[11px] text-ac-bone">
                  <input
                    type="checkbox"
                    checked={musicEnabled}
                    onChange={(event) => setMusicEnabled(event.target.checked)}
                    className="h-4 w-4 cursor-pointer accent-ac-frost"
                  />
                  <span>Background music</span>
                </label>

                <label className="flex cursor-pointer items-center gap-3 font-pixel text-[11px] text-ac-bone">
                  <input
                    type="checkbox"
                    checked={effectsEnabled}
                    onChange={(event) => setEffectsEnabled(event.target.checked)}
                    className="h-4 w-4 cursor-pointer accent-ac-frost"
                  />
                  <span>Sound effects</span>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isZooming}
                  className="min-w-[92px] border-2 border-ac-ash bg-ac-ink px-4 py-1.5 font-pixel text-[11px] uppercase text-ac-bone transition-all hover:bg-ac-ash/20 active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
                  style={{
                    boxShadow:
                      "inset 1px 1px 0px rgba(255,255,255,0.3), inset -1px -1px 0px rgba(0,0,0,0.2)",
                  }}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isZooming && <div className="fixed inset-0 z-[101] bg-ac-void" />}
    </>
  );
}
