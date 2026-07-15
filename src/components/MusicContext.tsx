"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface MusicControlsContextType {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  musicEnabled: boolean;
  togglePlayback: () => Promise<void>;
  seekTo: (time: number) => void;
  skipBy: (seconds: number) => void;
}

interface MusicTimelineContextType {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

const MusicControlsContext = createContext<
  MusicControlsContextType | undefined
>(undefined);
const MusicTimelineContext = createContext<
  MusicTimelineContextType | undefined
>(undefined);

export function MusicProvider({
  children,
  musicEnabled,
}: {
  children: ReactNode;
  musicEnabled: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("durationchange", handleLoadedMetadata);

    handleTimeUpdate();
    handleLoadedMetadata();
    setIsPlaying(!audio.paused);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("durationchange", handleLoadedMetadata);
    };
  }, []);

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !musicEnabled) return;

    if (audio.paused) {
      await audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [musicEnabled]);

  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const maximum = Number.isFinite(audio.duration) ? audio.duration : 0;
    audio.currentTime = Math.min(Math.max(time, 0), maximum);
  }, []);

  const skipBy = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      seekTo(audio.currentTime + seconds);
    },
    [seekTo],
  );

  const controls = useMemo(
    () => ({
      audioRef,
      musicEnabled,
      togglePlayback,
      seekTo,
      skipBy,
    }),
    [musicEnabled, seekTo, skipBy, togglePlayback],
  );
  const timeline = useMemo(
    () => ({ isPlaying, currentTime, duration }),
    [currentTime, duration, isPlaying],
  );

  return (
    <MusicControlsContext.Provider value={controls}>
      <MusicTimelineContext.Provider value={timeline}>
        {children}
      </MusicTimelineContext.Provider>
    </MusicControlsContext.Provider>
  );
}

export function useMusicControls() {
  const context = useContext(MusicControlsContext);
  if (!context) {
    throw new Error("useMusicControls must be used within MusicProvider");
  }
  return context;
}

export function useMusicTimeline() {
  const context = useContext(MusicTimelineContext);
  if (!context) {
    throw new Error("useMusicTimeline must be used within MusicProvider");
  }
  return context;
}

export function useMusic() {
  return {
    ...useMusicControls(),
    ...useMusicTimeline(),
  };
}
