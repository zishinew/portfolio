"use client";

import { useEffect, useRef, useState } from "react";

interface SoundPromptProps {
  onChoice: (soundOn: boolean) => void;
}

export default function SoundPrompt({ onChoice }: SoundPromptProps) {
  const [isExiting, setIsExiting] = useState(false);
  const exitTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => window.clearTimeout(exitTimerRef.current);
  }, []);

  const handleClick = (soundOn: boolean) => {
    if (isExiting) {
      return;
    }

    setIsExiting(true);
    const exitDelay = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
      ? 0
      : 520;
    exitTimerRef.current = window.setTimeout(
      () => onChoice(soundOn),
      exitDelay,
    );
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-ac-void ${isExiting ? "animate-prompt-exit" : ""}`}
    >
      <div className="relative w-[calc(100vw-2rem)] max-w-[320px] animate-glitch-appear">
        <div className={isExiting ? undefined : "animate-prompt-glitch"}>
          {/* Window container */}
          <div className="border-2 border-ac-ash bg-ac-ink shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
            {/* Title bar */}
            <div className="flex items-center justify-between bg-ac-frost px-2 py-1">
              <span className="font-pixel text-[11px] uppercase tracking-wider text-ac-void">
                System Message
              </span>
              <button
                type="button"
                aria-label="Disable sound"
                onClick={() => handleClick(false)}
                disabled={isExiting}
                className="flex h-11 w-11 items-center justify-center border border-ac-ash bg-ac-ink text-[10px] leading-none text-ac-bone hover:bg-ac-ash/30 disabled:pointer-events-none sm:h-6 sm:w-6"
              >
                ×
              </button>
            </div>

            {/* Content area */}
            <div className="px-6 py-8">
              <p className="mb-6 font-pixel text-[12px] leading-relaxed text-ac-bone">
                Enable sound?
              </p>

              {/* Buttons */}
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleClick(true)}
                  disabled={isExiting}
                  className="group relative min-h-11 min-w-[80px] border-2 border-ac-ash bg-ac-ink px-4 py-1.5 font-pixel text-[11px] uppercase text-ac-bone transition-[background-color,transform] hover:bg-ac-ash/20 active:translate-y-0.5"
                  style={{
                    boxShadow: "inset 1px 1px 0px rgba(255,255,255,0.3), inset -1px -1px 0px rgba(0,0,0,0.2)",
                  }}
                >
                  Sound On
                </button>
                <button
                  type="button"
                  onClick={() => handleClick(false)}
                  disabled={isExiting}
                  className="group relative min-h-11 min-w-[80px] border-2 border-ac-ash bg-ac-ink px-4 py-1.5 font-pixel text-[11px] uppercase text-ac-bone transition-[background-color,transform] hover:bg-ac-ash/20 active:translate-y-0.5"
                  style={{
                    boxShadow: "inset 1px 1px 0px rgba(255,255,255,0.3), inset -1px -1px 0px rgba(0,0,0,0.2)",
                  }}
                >
                  Sound Off
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
