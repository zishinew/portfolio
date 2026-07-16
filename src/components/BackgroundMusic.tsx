"use client";

import { useEffect } from "react";
import {
  BACKGROUND_MUSIC_LOOP_SECONDS,
  BACKGROUND_MUSIC_SRC,
} from "@/lib/audio";
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

    let animationFrame: number | undefined;

    const restartAtLoopPoint = () => {
      if (audio.currentTime < BACKGROUND_MUSIC_LOOP_SECONDS) return;
      audio.currentTime = 0;
    };

    const monitorPlayback = () => {
      restartAtLoopPoint();
      if (!audio.paused) {
        animationFrame = window.requestAnimationFrame(monitorPlayback);
      }
    };

    const startMonitoring = () => {
      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame);
      }
      monitorPlayback();
    };

    const stopMonitoring = () => {
      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = undefined;
      }
    };

    audio.addEventListener("play", startMonitoring);
    audio.addEventListener("pause", stopMonitoring);
    audio.addEventListener("timeupdate", restartAtLoopPoint);
    audio.addEventListener("seeking", restartAtLoopPoint);

    if (!audio.paused) startMonitoring();

    return () => {
      stopMonitoring();
      audio.removeEventListener("play", startMonitoring);
      audio.removeEventListener("pause", stopMonitoring);
      audio.removeEventListener("timeupdate", restartAtLoopPoint);
      audio.removeEventListener("seeking", restartAtLoopPoint);
    };
  }, [audioRef, shouldLoad]);

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

  return <audio ref={audioRef} src={BACKGROUND_MUSIC_SRC} preload="metadata" />;
}
