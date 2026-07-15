"use client";

import { useEffect } from "react";
import { useMusic } from "./MusicContext";

export default function BackgroundMusic() {
  const { audioRef, musicEnabled } = useMusic();

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
  }, [audioRef, musicEnabled]);

  return <audio ref={audioRef} src="/bg_music.mp3" preload="metadata" loop />;
}
