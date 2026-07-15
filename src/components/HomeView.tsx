"use client";

import Image, { getImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  portfolioSections,
  type PortfolioSection,
} from "@/lib/portfolio";

const heroPreviews = portfolioSections;
type HeroPreview = (typeof portfolioSections)[number];
const HERO_SIZES =
  "(max-width: 768px) 54vw, (max-width: 1200px) 52vw, (max-width: 2000px) 50vw, 960px";

const optimizedPreviewProps = new Map(
  heroPreviews.map((preview) => [
    preview.id,
    getImageProps({
      src: preview.previewSrc,
      alt: "",
      fill: true,
      sizes: HERO_SIZES,
    }).props,
  ]),
);

const heroPreviewLoadCache = new Map<string, Promise<void>>();

function preloadHeroPreview(preview: HeroPreview) {
  const cached = heroPreviewLoadCache.get(preview.id);

  if (cached) {
    return cached;
  }

  const promise = new Promise<void>((resolve) => {
    const imageProps = optimizedPreviewProps.get(preview.id);
    const image = new window.Image();
    image.decoding = "async";
    image.fetchPriority = "low";
    image.onload = () => {
      void image.decode().catch(() => {}).then(resolve);
    };
    image.onerror = () => resolve();

    if (imageProps?.sizes) {
      image.sizes = imageProps.sizes;
    }
    if (imageProps?.srcSet) {
      image.srcset = imageProps.srcSet;
    }
    image.src = String(imageProps?.src ?? preview.previewSrc);
  });

  heroPreviewLoadCache.set(preview.id, promise);
  return promise;
}

function HeroPreviewDeck({
  preview,
  sizes,
  isActive,
  preload = false,
}: {
  preview: HeroPreview;
  sizes: string;
  isActive: boolean;
  preload?: boolean;
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
    let isCancelled = false;
    const timer = window.setTimeout(() => {
      const preloadAdjacentPreviews = async () => {
        const currentIndex = heroPreviews.findIndex(
          (item) => item.id === preview.id,
        );
        const adjacentPreviews = [
          heroPreviews[(currentIndex - 1 + heroPreviews.length) % heroPreviews.length],
          heroPreviews[(currentIndex + 1) % heroPreviews.length],
        ];

        for (const item of adjacentPreviews) {
          if (isCancelled) {
            return;
          }
          await preloadHeroPreview(item);
        }
      };

      if ("requestIdleCallback" in window) {
        idleHandle = window.requestIdleCallback(preloadAdjacentPreviews, {
          timeout: 2000,
        });
        return;
      }

      void preloadAdjacentPreviews();
    }, 900);

    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
      if (idleHandle !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleHandle);
      }
    };
  }, [isActive, preview.id]);

  useEffect(() => {
    if (!isActive) {
      window.clearTimeout(outgoingTimeoutRef.current);
      const syncFrame = window.requestAnimationFrame(() => {
        previousPreviewRef.current = preview;
        setVisiblePreview(preview);
        setOutgoingPreview(null);
      });

      return () => window.cancelAnimationFrame(syncFrame);
    }

    if (previousPreviewRef.current.id === preview.id) {
      return;
    }

    let isCancelled = false;

    void preloadHeroPreview(preview).then(() => {
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
  }, [isActive, preview]);

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
          preload={preload && item.id === "about" && state === "current"}
          sizes={sizes}
          className="hero-preview-image object-cover"
        />
      </div>
    </div>
  );

  if (!isActive) {
    return null;
  }

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
  const heroDeckRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const deck = heroDeckRef.current;
    if (!deck) {
      return;
    }

    const canParallax =
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!canParallax) {
      return;
    }

    deck.dataset.parallax = "on";

    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let previousTime = 0;
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;

    const applyParallax = (time: number) => {
      const elapsed = previousTime ? Math.min(time - previousTime, 50) : 16;
      previousTime = time;
      const blend = 1 - Math.exp(-elapsed / 70);

      currentX += (targetX - currentX) * blend;
      currentY += (targetY - currentY) * blend;
      deck.style.transform = `translate3d(${(currentX * 14).toFixed(2)}px, ${(currentY * 14).toFixed(2)}px, 0) scale(1.06)`;

      if (
        Math.abs(targetX - currentX) > 0.001 ||
        Math.abs(targetY - currentY) > 0.001
      ) {
        frame = window.requestAnimationFrame(applyParallax);
      } else {
        frame = 0;
        previousTime = 0;
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      targetX = (event.clientX / viewportWidth) * 2 - 1;
      targetY = (event.clientY / viewportHeight) * 2 - 1;
      if (!frame) {
        frame = window.requestAnimationFrame(applyParallax);
      }
    };

    const handleResize = () => {
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
    };

    deck.style.transform = "translate3d(0, 0, 0) scale(1.06)";
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      window.cancelAnimationFrame(frame);
      delete deck.dataset.parallax;
      deck.style.removeProperty("transform");
    };
  }, [isActive]);

  return (
    <section className="relative h-full px-5 pt-20 sm:px-10 sm:pt-24">
      <span className="ac-vertical pointer-events-none absolute right-5 top-28 hidden select-none font-mono text-sm tracking-[0.4em] text-ac-ash/80 md:block">
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

      <div className="ac-image-edge-fade absolute inset-y-0 right-0 w-[54vw] max-w-[960px] md:w-[52vw] lg:w-[50vw] xl:w-[48vw]">
        <div
          ref={heroDeckRef}
          className="hero-preview-deck relative h-full w-full"
        >
          <HeroPreviewDeck
            preview={currentHeroPreview}
            sizes={HERO_SIZES}
            isActive={isActive}
            preload
          />
        </div>
      </div>
    </section>
  );
}
