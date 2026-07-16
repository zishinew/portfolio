"use client";

import Image, { getImageProps } from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AnimationEvent as ReactAnimationEvent,
  TransitionEvent as ReactTransitionEvent,
} from "react";
import {
  useSiteRevealControls,
  useSiteRevealPhase,
} from "@/components/SiteRevealContext";
import {
  portfolioSections,
  type PortfolioSection,
} from "@/lib/portfolio";
import { CherryBlossoms } from "@/components/ui/cherry-blossoms";

const heroPreviews = portfolioSections;
type HeroPreview = (typeof portfolioSections)[number];
const HERO_SIZES =
  "(max-width: 768px) 54vw, (max-width: 1200px) 52vw, (max-width: 2000px) 50vw, 960px";
const HERO_TRANSITION_MS = 360;

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

type HeroPreviewLoad = {
  promise: Promise<void>;
  image?: HTMLImageElement;
};

const heroPreviewLoadCache = new Map<string, HeroPreviewLoad>();

function preloadHeroPreview(
  preview: HeroPreview,
  fetchPriority: "high" | "low" = "high",
) {
  const cached = heroPreviewLoadCache.get(preview.id);

  if (cached) {
    if (fetchPriority === "high" && cached.image) {
      cached.image.fetchPriority = "high";
    }
    return cached.promise;
  }

  const image = new window.Image();
  let resolveLoad: () => void = () => {};
  const promise = new Promise<void>((resolve) => {
    resolveLoad = resolve;
  });
  const loadEntry: HeroPreviewLoad = { promise, image };
  const imageProps = optimizedPreviewProps.get(preview.id);
  const finish = () => {
    loadEntry.image = undefined;
    resolveLoad();
  };

  image.decoding = "async";
  image.fetchPriority = fetchPriority;
  image.onload = () => {
    void image.decode().catch(() => {}).then(finish);
  };
  image.onerror = finish;

  if (imageProps?.sizes) {
    image.sizes = imageProps.sizes;
  }
  if (imageProps?.srcSet) {
    image.srcset = imageProps.srcSet;
  }
  image.src = String(imageProps?.src ?? preview.previewSrc);

  heroPreviewLoadCache.set(preview.id, loadEntry);
  return promise;
}

function HeroPreviewDeck({
  preview,
  sizes,
  isActive,
  preload = false,
  onInitialReady,
}: {
  preview: HeroPreview;
  sizes: string;
  isActive: boolean;
  preload?: boolean;
  onInitialReady?: () => void;
}) {
  const [visiblePreview, setVisiblePreview] = useState(preview);
  const [outgoingPreview, setOutgoingPreview] =
    useState<HeroPreview | null>(null);
  const previousPreviewRef = useRef(preview);
  const outgoingTimeoutRef = useRef<number | undefined>(undefined);
  const hasReportedInitialReadyRef = useRef(false);

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
          await preloadHeroPreview(item, "low");
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

      const shouldAnimate = !window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      setOutgoingPreview(
        shouldAnimate ? previousPreviewRef.current : null,
      );
      previousPreviewRef.current = preview;
      setVisiblePreview(preview);

      window.clearTimeout(outgoingTimeoutRef.current);
      if (shouldAnimate) {
        outgoingTimeoutRef.current = window.setTimeout(() => {
          setOutgoingPreview(null);
        }, HERO_TRANSITION_MS + 100);
      }
    });

    return () => {
      isCancelled = true;
      window.clearTimeout(outgoingTimeoutRef.current);
    };
  }, [isActive, preview]);

  const handlePreviewAnimationEnd = (
    event: ReactAnimationEvent<HTMLDivElement>,
  ) => {
    if (
      event.target !== event.currentTarget ||
      event.animationName !== "heroPreviewArrive"
    ) {
      return;
    }

    window.clearTimeout(outgoingTimeoutRef.current);
    setOutgoingPreview(null);
  };

  const handlePreviewLoad = (state: "current" | "outgoing") => {
    if (state === "outgoing" || hasReportedInitialReadyRef.current) {
      return;
    }

    hasReportedInitialReadyRef.current = true;
    onInitialReady?.();
  };

  const renderPreview = (
    item: HeroPreview,
    state: "current" | "outgoing",
  ) => (
    <div
      key={item.id}
      aria-hidden={state === "outgoing"}
      data-preview-state={state}
      className="hero-preview-card absolute inset-0"
      onAnimationEnd={
        state === "current" ? handlePreviewAnimationEnd : undefined
      }
    >
      <div className="hero-preview-plate relative h-full w-full">
        <Image
          src={item.previewSrc}
          alt={state === "current" ? item.previewAlt : ""}
          fill
          preload={preload && item.id === "about" && state === "current"}
          sizes={sizes}
          className="hero-preview-image object-cover"
          onLoad={() => handlePreviewLoad(state)}
          onError={() => handlePreviewLoad(state)}
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
  isIntroReady,
  isReturningHome,
}: {
  activePreview: PortfolioSection;
  isActive: boolean;
  isIntroReady: boolean;
  isReturningHome: boolean;
}) {
  const currentHeroPreview =
    heroPreviews.find((preview) => preview.id === activePreview) ??
    heroPreviews[0];
  const heroDeckRef = useRef<HTMLDivElement>(null);
  const [isInitialHeroReady, setIsInitialHeroReady] = useState(false);
  const siteRevealPhase = useSiteRevealPhase();
  const { completePhase } = useSiteRevealControls();

  const handleInitialHeroReady = useCallback(() => {
    setIsInitialHeroReady(true);
  }, []);

  const middleRevealState =
    siteRevealPhase === "hidden" || siteRevealPhase === "background"
      ? "hidden"
      : siteRevealPhase === "middle"
        ? isInitialHeroReady
          ? "entering"
          : "hidden"
        : "visible";

  const handleMiddleRevealEnd = (
    event: ReactAnimationEvent<HTMLDivElement>,
  ) => {
    if (
      event.target === event.currentTarget &&
      event.animationName === "homeMiddleReveal"
    ) {
      completePhase("middle");
    }
  };

  const handleForegroundRevealEnd = (
    event: ReactTransitionEvent<HTMLHeadingElement>,
  ) => {
    if (
      event.target === event.currentTarget &&
      event.propertyName === "opacity" &&
      siteRevealPhase === "foreground"
    ) {
      completePhase("foreground");
    }
  };

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
      // Scale is oversized enough to cover the larger translate range below
      // without exposing the deck's edges.
      deck.style.transform = `translate3d(${(currentX * 26).toFixed(2)}px, ${(currentY * 26).toFixed(2)}px, 0) scale(1.11)`;

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

    deck.style.transform = "translate3d(0, 0, 0) scale(1.11)";
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
      <div
        className="home-intro-middle-layer pointer-events-none absolute inset-0"
        data-reveal-state={middleRevealState}
        onAnimationEnd={handleMiddleRevealEnd}
      >
        <span className="ac-vertical absolute right-5 top-28 hidden select-none font-mono text-sm tracking-[0.4em] text-ac-ash/80 md:block">
          日々の記録 — 未送信のもの
        </span>

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
              onInitialReady={handleInitialHeroReady}
            />
            <CherryBlossoms />
          </div>
        </div>
      </div>

      <div
        className="home-intro-copy pointer-events-none relative z-[10] mx-auto mt-[8svh] max-w-6xl sm:mt-[14vh]"
        data-intro-ready={isIntroReady}
        data-returning-home={isReturningHome}
      >
        <p className="home-intro-meta pointer-events-none relative z-10 mb-4 font-mono text-[9px] uppercase tracking-[0.5em] text-ac-ash sm:text-[10px]">
          vol. i — personal archive
        </p>
        <h1
          className="home-intro-name pointer-events-none relative z-10 text-[16vw] font-medium lowercase leading-[0.82] tracking-tight text-ac-halo sm:text-[11.5vw] md:text-[7vw]"
          onTransitionEnd={handleForegroundRevealEnd}
        >
          zishine
          <br />
          wang
        </h1>
        <p className="home-intro-meta pointer-events-none relative z-10 mt-6 max-w-md font-mono text-[9px] uppercase tracking-[0.25em] text-ac-fog sm:text-[11px] sm:tracking-[0.3em]">
          software developer
          <br />
          mathematics @ university of waterloo
        </p>
      </div>

    </section>
  );
}
