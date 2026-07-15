"use client";

import { useEffect, useState } from "react";

interface SoundPromptProps {
  onChoice: (soundOn: boolean) => void;
}

export default function SoundPrompt({ onChoice }: SoundPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [glitchOffset, setGlitchOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setGlitchOffset({
          x: (Math.random() - 0.5) * 4,
          y: (Math.random() - 0.5) * 2,
        });
        setTimeout(() => setGlitchOffset({ x: 0, y: 0 }), 50);
      }
    }, 200);

    return () => clearInterval(glitchInterval);
  }, [isVisible]);

  const handleClick = (soundOn: boolean) => {
    setIsZooming(true);
    setTimeout(() => onChoice(soundOn), 600);
  };

  if (!isVisible) return null;

  return (
    <>
      <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-ac-void ${isZooming ? 'animate-zoom-in' : ''}`}>
        <div
          className="relative w-[320px] animate-glitch-appear"
          style={{
            transform: `translate(${glitchOffset.x}px, ${glitchOffset.y}px)`,
          }}
        >
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
                disabled={isZooming}
                className="flex h-4 w-4 items-center justify-center border border-ac-ash bg-ac-ink text-[10px] leading-none text-ac-bone hover:bg-ac-ash/30 disabled:pointer-events-none"
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
                  disabled={isZooming}
                  className="group relative min-w-[80px] border-2 border-ac-ash bg-ac-ink px-4 py-1.5 font-pixel text-[11px] uppercase text-ac-bone transition-all hover:bg-ac-ash/20 active:translate-y-0.5"
                  style={{
                    boxShadow: "inset 1px 1px 0px rgba(255,255,255,0.3), inset -1px -1px 0px rgba(0,0,0,0.2)",
                  }}
                >
                  Sound On
                </button>
                <button
                  type="button"
                  onClick={() => handleClick(false)}
                  disabled={isZooming}
                  className="group relative min-w-[80px] border-2 border-ac-ash bg-ac-ink px-4 py-1.5 font-pixel text-[11px] uppercase text-ac-bone transition-all hover:bg-ac-ash/20 active:translate-y-0.5"
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
      {isZooming && <div className="fixed inset-0 z-[101] bg-ac-void" />}
    </>
  );
}
