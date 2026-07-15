"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  portfolioSections,
  type PortfolioSection,
} from "@/lib/portfolio";

const heroPreviews = portfolioSections;
type HeroPreview = (typeof portfolioSections)[number];

const heroPreviewLoadCache = new Map<string, Promise<void>>();

function preloadHeroPreview(src: string) {
  const cached = heroPreviewLoadCache.get(src);

  if (cached) {
    return cached;
  }

  const promise = new Promise<void>((resolve) => {
    const image = new window.Image();
    image.decoding = "async";
    image.onload = () => {
      const decoded = image.decode?.();

      if (decoded) {
        void decoded.finally(resolve);
        return;
      }

      resolve();
    };
    image.onerror = () => resolve();
    image.src = src;
  });

  heroPreviewLoadCache.set(src, promise);
  return promise;
}

function HeroPreviewDeck({
  preview,
  sizes,
  isActive,
  priority = false,
}: {
  preview: HeroPreview;
  sizes: string;
  isActive: boolean;
  priority?: boolean;
}) {
  const [visiblePreview, setVisiblePreview] = useState(preview);
  const [outgoingPreview, setOutgoingPreview] =
    useState<HeroPreview | null>(null);
  const previousPreviewRef = useRef(preview);
  const outgoingTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    let idleHandle: number | undefined;
    const timer = window.setTimeout(() => {
      const preloadRemainingPreviews = () => {
        heroPreviews.forEach((item) => {
          if (item.id !== preview.id) {
            void preloadHeroPreview(item.previewSrc);
          }
        });
      };

      if ("requestIdleCallback" in window) {
        idleHandle = window.requestIdleCallback(preloadRemainingPreviews, {
          timeout: 2000,
        });
        return;
      }

      preloadRemainingPreviews();
    }, 1400);

    return () => {
      window.clearTimeout(timer);
      if (idleHandle !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleHandle);
      }
    };
  }, [isActive, preview.id]);

  useEffect(() => {
    if (previousPreviewRef.current.id === preview.id) {
      return;
    }

    let isCancelled = false;

    void preloadHeroPreview(preview.previewSrc).then(() => {
      if (isCancelled) {
        return;
      }

      setOutgoingPreview(previousPreviewRef.current);
      previousPreviewRef.current = preview;
      setVisiblePreview(preview);

      window.clearTimeout(outgoingTimeoutRef.current);
      outgoingTimeoutRef.current = window.setTimeout(() => {
        setOutgoingPreview(null);
      }, 380);
    });

    return () => {
      isCancelled = true;
      window.clearTimeout(outgoingTimeoutRef.current);
    };
  }, [preview]);

  const renderPreview = (
    item: HeroPreview,
    state: "current" | "outgoing",
  ) => (
    <div
      key={`${state}-${item.id}`}
      aria-hidden={state === "outgoing"}
      data-preview-state={state}
      className="hero-preview-card absolute inset-0"
    >
      <div className="hero-preview-plate relative h-full w-full">
        <Image
          src={item.previewSrc}
          alt={state === "current" ? item.previewAlt : ""}
          fill
          priority={priority && item.id === "about" && state === "current"}
          sizes={sizes}
          unoptimized
          className="hero-preview-image object-cover"
        />
      </div>
    </div>
  );

  return (
    <>
      {outgoingPreview && renderPreview(outgoingPreview, "outgoing")}
      {renderPreview(visiblePreview, "current")}
    </>
  );
}

export default function HomeView({
  activePreview,
  isActive,
}: {
  activePreview: PortfolioSection;
  isActive: boolean;
}) {
  const currentHeroPreview =
    heroPreviews.find((preview) => preview.id === activePreview) ??
    heroPreviews[0];
  const heroImageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const container = heroImageRef.current;
    if (!container) {
      return;
    }

    const canParallax =
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!canParallax) {
      return;
    }

    container.dataset.parallax = "on";

    let frame = 0;
    let latestX = 0;
    let latestY = 0;

    const applyParallax = () => {
      frame = 0;
      container.style.setProperty("--parallax-x", latestX.toFixed(3));
      container.style.setProperty("--parallax-y", latestY.toFixed(3));
    };

    const handlePointerMove = (event: PointerEvent) => {
      latestX = (event.clientX / window.innerWidth) * 2 - 1;
      latestY = (event.clientY / window.innerHeight) * 2 - 1;
      if (!frame) {
        frame = requestAnimationFrame(applyParallax);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(frame);
    };
  }, [isActive]);

  return (
    <section className="relative h-full px-5 pt-20 sm:px-10 sm:pt-24">
      <span className="ac-vertical pointer-events-none absolute right-5 top-28 hidden select-none font-pixel text-sm tracking-[0.4em] text-ac-ash/80 md:block">
        日々の記録 — 未送信のもの
      </span>

      <div className="pointer-events-none relative z-[10] mx-auto mt-[8svh] max-w-6xl sm:mt-[14vh]">
        <p className="pointer-events-none relative z-10 mb-4 font-mono text-[9px] uppercase tracking-[0.5em] text-ac-ash sm:text-[10px]">
          vol. i — personal archive
        </p>
        <h1 className="pointer-events-none relative z-10 text-[16vw] font-medium lowercase leading-[0.82] tracking-tight text-ac-halo sm:text-[11.5vw] md:text-[7vw]">
          zishine
          <br />
          wang
        </h1>
        <p className="pointer-events-none relative z-10 mt-6 max-w-md font-mono text-[9px] uppercase tracking-[0.25em] text-ac-fog sm:text-[11px] sm:tracking-[0.3em]">
          software developer
          <br />
          mathematics @ university of waterloo
        </p>
      </div>

      <div
        ref={heroImageRef}
        className="ac-image-edge-fade absolute inset-y-0 right-0 w-[54vw] md:w-[52vw] lg:w-[50vw] xl:w-[48vw]"
      >
        <div className="hero-preview-deck relative h-full w-full">
          <HeroPreviewDeck
            preview={currentHeroPreview}
            sizes="(max-width: 768px) 54vw, (max-width: 1200px) 52vw, 960px"
            isActive={isActive}
            priority
          />
        </div>
      </div>
    </section>
  );
}
