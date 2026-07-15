"use client";

import { useEffect } from "react";
import { useMusicControls } from "./MusicContext";

export default function BackgroundMusic({
  shouldLoad,
}: {
  shouldLoad: boolean;
}) {
  const { audioRef, musicEnabled } = useMusicControls();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!musicEnabled) {
      audio.pause();
      return;
    }

    const removeFallbackListeners = () => {
      document.removeEventListener("click", play);
      document.removeEventListener("touchstart", play);
      document.removeEventListener("keydown", play);
    };

    const play = () => {
      void audio.play().then(removeFallbackListeners).catch(() => {});
    };

    document.addEventListener("click", play);
    document.addEventListener("touchstart", play);
    document.addEventListener("keydown", play);
    play();

    return removeFallbackListeners;
  }, [audioRef, musicEnabled, shouldLoad]);

  if (!shouldLoad) {
    return null;
  }

  return <audio ref={audioRef} src="/bg_music.mp3" preload="metadata" loop />;
}
