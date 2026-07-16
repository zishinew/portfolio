"use client";

import { getImageProps } from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AsciiArtStatic } from "@/components/ui/ascii-art";
import { AsciiMusicScoreLayer } from "@/components/ui/ascii-music-score";
import BackgroundMusic from "@/components/BackgroundMusic";
import { MusicProvider } from "@/components/MusicContext";
import PlayerBar from "@/components/PlayerBar";
import SoundPrompt from "@/components/SoundPrompt";
import AudioPreferencesPrompt, {
  type AudioPreferences,
} from "@/components/AudioPreferencesPrompt";
import { SoundProvider } from "@/components/SoundContext";
import {
  SiteRevealProvider,
  type SiteRevealPhase,
} from "@/components/SiteRevealContext";

const asciiTextureImageProps = getImageProps({
  src: "/test.png",
  alt: "",
  width: 256,
  height: 432,
  quality: 75,
}).props;
const ASCII_TEXTURE_SRC =
  asciiTextureImageProps.srcSet?.split(",")[0]?.trim().split(" ")[0] ??
  String(asciiTextureImageProps.src);

type AnimatedSiteRevealPhase = Exclude<
  SiteRevealPhase,
  "hidden" | "complete"
>;

const NEXT_REVEAL_PHASE: Record<
  AnimatedSiteRevealPhase,
  SiteRevealPhase
> = {
  background: "middle",
  middle: "flower",
  flower: "foreground",
  foreground: "complete",
};

// Normal progression comes from each layer's completion event. These only
// prevent an interrupted CSS animation from leaving the page hidden.
const REVEAL_FALLBACK_MS: Record<AnimatedSiteRevealPhase, number> = {
  background: 360,
  middle: 2000,
  flower: 620,
  foreground: 800,
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [soundChoice, setSoundChoice] = useState<boolean | null>(null);
  const [audioPreferences, setAudioPreferences] = useState<AudioPreferences>({
    musicEnabled: false,
    effectsEnabled: false,
  });
  const [revealPhase, setRevealPhase] =
    useState<SiteRevealPhase>("hidden");
  const [showPreferencesPrompt, setShowPreferencesPrompt] = useState(false);
  const isAsciiReadyRef = useRef(false);
  const isRevealRequestedRef = useRef(false);
  const hasRevealStartedRef = useRef(false);

  const finishReveal = useCallback(() => {
    hasRevealStartedRef.current = true;
    setRevealPhase("complete");
  }, []);

  const completeRevealPhase = useCallback(
    (completedPhase: AnimatedSiteRevealPhase) => {
      setRevealPhase((currentPhase) =>
        currentPhase === completedPhase
          ? NEXT_REVEAL_PHASE[completedPhase]
          : currentPhase,
      );
    },
    [],
  );

  const beginRevealIfReady = useCallback(() => {
    if (
      hasRevealStartedRef.current ||
      !isAsciiReadyRef.current ||
      !isRevealRequestedRef.current
    ) {
      return;
    }

    hasRevealStartedRef.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealPhase("complete");
      return;
    }

    setRevealPhase("background");
  }, []);

  const handleAsciiReady = useCallback(() => {
    isAsciiReadyRef.current = true;
    beginRevealIfReady();
  }, [beginRevealIfReady]);

  const requestReveal = useCallback(() => {
    isRevealRequestedRef.current = true;
    beginRevealIfReady();
  }, [beginRevealIfReady]);

  useEffect(() => {
    if (revealPhase === "hidden" || revealPhase === "complete") {
      return;
    }

    const fallbackTimer = window.setTimeout(
      () => completeRevealPhase(revealPhase),
      REVEAL_FALLBACK_MS[revealPhase],
    );
    return () => window.clearTimeout(fallbackTimer);
  }, [completeRevealPhase, revealPhase]);

  const handleSoundChoice = (enabled: boolean) => {
    setSoundChoice(enabled);

    if (enabled) {
      setShowPreferencesPrompt(true);
      return;
    }

    setAudioPreferences({ musicEnabled: false, effectsEnabled: false });
    requestReveal();
  };

  const handleAudioPreferences = (preferences: AudioPreferences) => {
    setAudioPreferences(preferences);
    setShowPreferencesPrompt(false);
    requestReveal();
  };

  const isRevealVisible = revealPhase !== "hidden";
  const isRevealComplete = revealPhase === "complete";
  const backgroundRevealState =
    revealPhase === "hidden"
      ? "hidden"
      : revealPhase === "background"
        ? "entering"
        : "visible";

  return (
    <>
      <SoundProvider soundEnabled={audioPreferences.effectsEnabled}>
        <MusicProvider musicEnabled={audioPreferences.musicEnabled}>
          <SiteRevealProvider
            phase={revealPhase}
            completePhase={completeRevealPhase}
            finishReveal={finishReveal}
          >
            <BackgroundMusic
              shouldLoad={
                soundChoice === true || audioPreferences.musicEnabled
              }
            />

            {isRevealComplete && audioPreferences.musicEnabled && (
              <PlayerBar />
            )}

            {/* Prepare the back layer behind the opaque prompt. */}
            <div
              className="fx-layer fx-vignette site-vignette-layer"
              data-reveal-state={backgroundRevealState}
              aria-hidden
            />
            <AsciiArtStatic
              src={ASCII_TEXTURE_SRC}
              resolution={132}
              charset="dense"
              color="#44474d"
              inverted
              objectFit="fill"
              revealState={backgroundRevealState}
              onReady={handleAsciiReady}
              onRevealComplete={() => completeRevealPhase("background")}
              className="pointer-events-none fixed -left-12 top-1/2 z-[1] aspect-[811/1368] w-[clamp(340px,40vw,640px)] -translate-y-1/2 select-none"
            />
            <AsciiMusicScoreLayer
              revealState={backgroundRevealState}
              className="pointer-events-none fixed inset-0 z-[2] select-none"
            />

            <div
              className="relative z-10 h-[100svh] overflow-hidden"
              style={{ display: isRevealVisible ? undefined : "none" }}
            >
              {children}
            </div>

            {soundChoice !== null &&
              !showPreferencesPrompt &&
              !isRevealVisible && (
                <div
                  className="fixed inset-0 z-[90] bg-ac-void"
                  aria-hidden
                />
              )}

            {soundChoice === null && (
              <SoundPrompt onChoice={handleSoundChoice} />
            )}
            {showPreferencesPrompt && (
              <AudioPreferencesPrompt onConfirm={handleAudioPreferences} />
            )}
          </SiteRevealProvider>
        </MusicProvider>
      </SoundProvider>
    </>
  );
}
