"use client";

import { useState } from "react";
import { AsciiArtStatic } from "@/components/ui/ascii-art";
import BackgroundMusic from "@/components/BackgroundMusic";
import { MusicProvider } from "@/components/MusicContext";
import PlayerBar from "@/components/PlayerBar";
import SoundPrompt from "@/components/SoundPrompt";
import AudioPreferencesPrompt, {
  type AudioPreferences,
} from "@/components/AudioPreferencesPrompt";
import { SoundProvider } from "@/components/SoundContext";
import { SiteRevealProvider } from "@/components/SiteRevealContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [soundChoice, setSoundChoice] = useState<boolean | null>(null);
  const [audioPreferences, setAudioPreferences] = useState<AudioPreferences>({
    musicEnabled: false,
    effectsEnabled: false,
  });
  const [isRevealing, setIsRevealing] = useState(false);
  const [showPreferencesPrompt, setShowPreferencesPrompt] = useState(false);

  const handleSoundChoice = (enabled: boolean) => {
    setSoundChoice(enabled);

    if (enabled) {
      setShowPreferencesPrompt(true);
      return;
    }

    setAudioPreferences({ musicEnabled: false, effectsEnabled: false });
    setIsRevealing(true);
  };

  const handleAudioPreferences = (preferences: AudioPreferences) => {
    setAudioPreferences(preferences);
    setShowPreferencesPrompt(false);
    setIsRevealing(true);
  };

  return (
    <>
      <SoundProvider soundEnabled={audioPreferences.effectsEnabled}>
        <MusicProvider musicEnabled={audioPreferences.musicEnabled}>
          <SiteRevealProvider isRevealed={isRevealing}>
            <BackgroundMusic
              shouldLoad={
                soundChoice === true || audioPreferences.musicEnabled
              }
            />

            <div
              aria-hidden={!isRevealing}
              style={{ display: isRevealing ? undefined : "none" }}
            >
              {audioPreferences.musicEnabled && <PlayerBar />}

              {/* archivecore site-wide texture layers */}
              <div className="fx-layer fx-bloom" aria-hidden />
              <div className="fx-layer fx-vignette" aria-hidden />
              <div className="fx-layer fx-grain" aria-hidden />
              <AsciiArtStatic
                src="/test.png"
                resolution={132}
                charset="dense"
                color="#44474d"
                inverted
                objectFit="fill"
                className="pointer-events-none fixed -left-12 top-1/2 z-[1] aspect-[811/1368] w-[clamp(340px,40vw,640px)] -translate-y-1/2 select-none"
              />
            </div>

            <div
              className={`relative z-10 h-[100svh] overflow-hidden ${isRevealing ? "animate-page-reveal" : ""}`}
              style={{ display: isRevealing ? undefined : "none" }}
            >
              {children}
            </div>

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
