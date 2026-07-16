"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type AnimationEvent as ReactAnimationEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import HomeView from "@/components/HomeView";
import MechanicalFlower from "@/components/MechanicalFlower";
import PortfolioSectionView from "@/components/PortfolioPage";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import {
  useSiteReveal,
  useSiteRevealControls,
  useSiteRevealPhase,
} from "@/components/SiteRevealContext";
import {
  getPortfolioSection,
  isPortfolioSection,
  type PortfolioSection,
} from "@/lib/portfolio";

const SELECTED_PETAL_ANGLE = 90;
const CONTENT_TRANSITION_MS = 560;

type HistoryMode = "none" | "push";

function sectionFromPathname(pathname: string): PortfolioSection | null | undefined {
  if (pathname === "/") {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 1 || !isPortfolioSection(segments[0])) {
    return undefined;
  }

  return segments[0];
}

function titleForSection() {
  return "zishine";
}

export default function PortfolioApp({
  initialSection,
}: {
  initialSection: PortfolioSection | null;
}) {
  const { playHover, playClick, playSpecialClick } = useSoundEffects();
  const isSiteRevealed = useSiteReveal();
  const siteRevealPhase = useSiteRevealPhase();
  const { completePhase, finishReveal } = useSiteRevealControls();
  const [activeSection, setActiveSection] =
    useState<PortfolioSection | null>(initialSection);
  const activeSectionRef = useRef<PortfolioSection | null>(initialSection);
  const [outgoingSection, setOutgoingSection] =
    useState<PortfolioSection | null>(null);
  const [contentTransitionKey, setContentTransitionKey] = useState(0);
  const contentTimerRef = useRef<number | undefined>(undefined);
  const [activePreview, setActivePreview] = useState<PortfolioSection>(
    initialSection ?? "about",
  );
  const [isHomeIntroComplete, setIsHomeIntroComplete] = useState(
    initialSection !== null,
  );
  const [isReturningHome, setIsReturningHome] = useState(false);
  const isReturningHomeRef = useRef(false);

  const [isFlowerHomePositioned, setIsFlowerHomePositioned] = useState(
    initialSection === null,
  );
  const isFlowerHomePositionedRef = useRef(initialSection === null);
  const flowerMenuRef = useRef<HTMLDivElement>(null);
  const flowerStartRectRef = useRef<DOMRect | undefined>(undefined);

  const completeHomeIntro = useCallback(() => {
    const revealName = () => setIsHomeIntroComplete(true);

    if (document.fonts?.ready) {
      void document.fonts.ready.then(revealName);
      return;
    }

    revealName();
  }, []);

  const completeHomeReturn = useCallback(() => {
    const revealName = () => {
      if (!isReturningHomeRef.current) {
        return;
      }

      isReturningHomeRef.current = false;
      setIsReturningHome(false);
      setIsHomeIntroComplete(true);
    };

    if (document.fonts?.ready) {
      void document.fonts.ready.then(revealName);
      return;
    }

    revealName();
  }, []);

  const startHomeReturn = useCallback(() => {
    isReturningHomeRef.current = true;
    setIsReturningHome(true);
    setIsHomeIntroComplete(false);
  }, []);

  const completeFlowerIntro = useCallback(() => {
    completeHomeIntro();
    completePhase("flower");
  }, [completeHomeIntro, completePhase]);

  const moveFlowerTo = useCallback((homePositioned: boolean) => {
    if (isFlowerHomePositionedRef.current === homePositioned) {
      return;
    }

    flowerStartRectRef.current =
      flowerMenuRef.current?.getBoundingClientRect();
    isFlowerHomePositionedRef.current = homePositioned;
    setIsFlowerHomePositioned(homePositioned);
  }, []);

  useLayoutEffect(() => {
    const flowerMenu = flowerMenuRef.current;
    const start = flowerStartRectRef.current;
    flowerStartRectRef.current = undefined;

    if (!flowerMenu || !start) {
      if (isFlowerHomePositioned && isReturningHomeRef.current) {
        const revealFrame = window.requestAnimationFrame(
          completeHomeReturn,
        );
        return () => window.cancelAnimationFrame(revealFrame);
      }
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (isFlowerHomePositioned && isReturningHomeRef.current) {
        const revealFrame = window.requestAnimationFrame(
          completeHomeReturn,
        );
        return () => window.cancelAnimationFrame(revealFrame);
      }
      return;
    }

    const end = flowerMenu.getBoundingClientRect();
    flowerMenu.style.willChange = "transform";
    const animation = flowerMenu.animate(
      [
        {
          transformOrigin: "top left",
          transform: `translate3d(${start.left - end.left}px, ${start.top - end.top}px, 0) scale(${start.width / end.width}, ${start.height / end.height})`,
        },
        {
          transformOrigin: "top left",
          transform: "translate3d(0, 0, 0) scale(1)",
        },
      ],
      {
        duration: 760,
        easing: "cubic-bezier(0.33, 1, 0.68, 1)",
      },
    );

    const clearCompositorHint = () => {
      flowerMenu.style.removeProperty("will-change");
    };

    animation.onfinish = () => {
      clearCompositorHint();
      if (isFlowerHomePositioned) {
        completeHomeReturn();
      }
    };
    animation.oncancel = clearCompositorHint;

    return () => {
      animation.cancel();
      clearCompositorHint();
    };
  }, [completeHomeReturn, isFlowerHomePositioned]);

  const showSection = useCallback(
    (nextSection: PortfolioSection | null, historyMode: HistoryMode) => {
      const currentSection = activeSectionRef.current;

      if (currentSection === nextSection) {
        return;
      }

      window.clearTimeout(contentTimerRef.current);

      setOutgoingSection(
        currentSection && nextSection ? currentSection : null,
      );
      activeSectionRef.current = nextSection;
      setActiveSection(nextSection);
      setContentTransitionKey((key) => key + 1);

      if (currentSection && nextSection) {
        contentTimerRef.current = window.setTimeout(() => {
          setOutgoingSection(null);
        }, CONTENT_TRANSITION_MS);
      }

      if (historyMode === "push") {
        const nextPath = nextSection ? `/${nextSection}` : "/";
        window.history.pushState(
          { portfolioSection: nextSection },
          "",
          nextPath,
        );
      }

      document.title = titleForSection();
    },
    [],
  );

  const openSection = useCallback(
    (nextSection: PortfolioSection) => {
      isReturningHomeRef.current = false;
      setIsReturningHome(false);
      setIsHomeIntroComplete(true);
      finishReveal();
      setActivePreview(nextSection);
      moveFlowerTo(false);
      showSection(nextSection, "push");
    },
    [finishReveal, moveFlowerTo, showSection],
  );

  const returnHome = useCallback(() => {
    startHomeReturn();
    setActivePreview(activeSectionRef.current ?? "about");
    moveFlowerTo(true);
    showSection(null, "push");
  }, [moveFlowerTo, showSection, startHomeReturn]);

  const handleReturnHome = useCallback(() => {
    playClick();
    returnHome();
  }, [playClick, returnHome]);

  const keepFlowerCompact = useCallback(() => {
    return SELECTED_PETAL_ANGLE;
  }, []);

  const handleLinkClickCapture = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (!link) {
        return;
      }

      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin) {
        playSpecialClick();
      }
    },
    [playSpecialClick],
  );

  useEffect(() => {
    const handlePopState = () => {
      const nextSection = sectionFromPathname(window.location.pathname);
      if (nextSection === undefined) {
        return;
      }

      if (nextSection) {
        setActivePreview(nextSection);
      } else if (activeSectionRef.current !== null) {
        startHomeReturn();
      }
      moveFlowerTo(nextSection === null);
      showSection(nextSection, "none");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [moveFlowerTo, showSection, startHomeReturn]);

  useEffect(() => {
    return () => window.clearTimeout(contentTimerRef.current);
  }, []);

  const isHome = activeSection === null;
  const isSubpageMenuActive = !isHome && isFlowerHomePositioned;
  const current = activeSection
    ? getPortfolioSection(activeSection)
    : null;

  const flowerIntroState =
    siteRevealPhase === "hidden" ||
    siteRevealPhase === "background" ||
    siteRevealPhase === "middle" ||
    siteRevealPhase === "score"
      ? "hidden"
      : siteRevealPhase === "flower"
        ? "entering"
        : "visible";

  useEffect(() => {
    if (isHome || siteRevealPhase !== "middle") {
      return;
    }

    const revealFrame = window.requestAnimationFrame(() =>
      completePhase("middle"),
    );
    return () => window.cancelAnimationFrame(revealFrame);
  }, [completePhase, isHome, siteRevealPhase]);

  const handleSectionRevealEnd = useCallback(
    (event: ReactAnimationEvent<HTMLDivElement>) => {
      if (
        !isHome &&
        siteRevealPhase === "foreground" &&
        event.target === event.currentTarget &&
        event.animationName === "portfolioSectionIntro"
      ) {
        completePhase("foreground");
      }
    },
    [completePhase, isHome, siteRevealPhase],
  );

  useEffect(() => {
    if (!isHome || !isReturningHome) {
      return;
    }

    // The FLIP completion is the normal handoff; this covers interruption.
    const fallbackTimer = window.setTimeout(completeHomeReturn, 900);
    return () => window.clearTimeout(fallbackTimer);
  }, [completeHomeReturn, isHome, isReturningHome]);

  useEffect(() => {
    if (
      isHomeIntroComplete ||
      isReturningHome ||
      !isSiteRevealed ||
      !isHome ||
      siteRevealPhase === "background" ||
      siteRevealPhase === "middle" ||
      siteRevealPhase === "score" ||
      siteRevealPhase === "hidden"
    ) {
      return;
    }

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      siteRevealPhase === "foreground" ||
      siteRevealPhase === "complete"
    ) {
      const revealFrame = window.requestAnimationFrame(completeHomeIntro);
      return () => window.cancelAnimationFrame(revealFrame);
    }

    // Animation events are the primary handoff; this only covers interruption.
    const fallbackTimer = window.setTimeout(completeHomeIntro, 650);
    return () => window.clearTimeout(fallbackTimer);
  }, [
    completeHomeIntro,
    isHome,
    isHomeIntroComplete,
    isReturningHome,
    isSiteRevealed,
    siteRevealPhase,
  ]);

  return (
    <main
      className="portfolio-app relative h-[100svh] w-full overflow-hidden font-garamond text-ac-bone"
      data-site-reveal-phase={siteRevealPhase}
      onClickCapture={handleLinkClickCapture}
    >
      <header className="site-intro-chrome pointer-events-none fixed inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-4 font-mono text-[10px] uppercase tracking-[0.25em] text-ac-ash sm:px-8">
        <span aria-hidden />
        <span className="font-pixel text-[12px] normal-case tracking-normal">
          {current ? `${current.number} / 05` : "©2007"}
        </span>
      </header>

      <div
        className="portfolio-live-layer portfolio-home-layer"
        data-state={isHome ? "active" : "inactive"}
        aria-hidden={!isHome}
        style={{ zIndex: "auto" }}
      >
        <HomeView
          activePreview={activePreview}
          isActive={isHome}
          isIntroReady={isHomeIntroComplete}
          isReturningHome={isReturningHome}
        />
      </div>

      <div
        className="portfolio-live-layer portfolio-section-layer"
        data-state={isHome ? "inactive" : "active"}
        data-menu-active={isSubpageMenuActive}
        aria-hidden={isHome}
        onAnimationEnd={handleSectionRevealEnd}
      >
        <div className="portfolio-page-grid relative z-10 mx-auto grid h-[100svh] max-w-[1600px] overflow-hidden lg:grid-cols-[minmax(420px,42vw)_1fr]">
          <div className="portfolio-flower-panel relative hidden lg:block" aria-hidden />

          <section className="portfolio-scroll-region relative flex h-[100svh] items-start overflow-x-hidden overflow-y-auto overscroll-contain px-5 pb-72 pt-20 sm:px-10 sm:pb-80 sm:pt-24 lg:items-center lg:overflow-hidden lg:px-12 lg:py-24 xl:px-16">
            <div
              className="portfolio-content-stack relative w-full max-w-5xl"
            >
              {outgoingSection && (
                <div
                  key={`outgoing-${outgoingSection}-${contentTransitionKey}`}
                  className="portfolio-live-content is-outgoing"
                  aria-hidden
                >
                  <PortfolioSectionView section={outgoingSection} />
                </div>
              )}

              {activeSection && (
                <div
                  key={`incoming-${activeSection}-${contentTransitionKey}`}
                  className={`portfolio-live-content ${contentTransitionKey === 0 ? "is-settled" : "is-incoming"}`}
                >
                  <PortfolioSectionView section={activeSection} />
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <button
        type="button"
        onMouseEnter={playHover}
        onClick={handleReturnHome}
        className="portfolio-back-button group fixed bottom-16 right-5 z-40 flex min-h-11 isolate items-center text-ac-fog hover:text-ac-halo focus-visible:outline-none sm:right-8 lg:left-8 lg:right-auto"
        data-visible={
          !isHome &&
          (siteRevealPhase === "foreground" ||
            siteRevealPhase === "complete")
        }
        aria-label="Back to portfolio home"
        aria-hidden={isHome}
        tabIndex={isHome ? -1 : 0}
        disabled={isHome}
      >
        <span
          className="relative z-10 text-base leading-none transition-transform duration-200 group-hover:-translate-x-1 group-focus-visible:-translate-x-1"
          aria-hidden
        >
          ←
        </span>
        <span
          className="relative z-10 pl-2.5 font-garamond text-sm lowercase tracking-[0.04em] sm:text-base"
          data-ascii-dispel={!isHome ? "" : undefined}
        >
          home
        </span>
      </button>

      <div
        ref={flowerMenuRef}
        className={`portfolio-flower-menu fixed bottom-16 left-3 h-40 w-40 sm:left-6 sm:h-52 sm:w-52 lg:bottom-auto lg:left-[1vw] lg:top-1/2 lg:h-[40vw] lg:max-h-[650px] lg:min-h-[420px] lg:w-[40vw] lg:max-w-[650px] lg:min-w-[420px] lg:-translate-y-1/2 ${isHome ? "z-[6]" : "z-30"}${isFlowerHomePositioned ? " is-home-positioned" : ""}`}
        aria-label="Portfolio menu"
      >
        <MechanicalFlower
          introState={flowerIntroState}
          onIntroComplete={completeFlowerIntro}
          onNavigate={keepFlowerCompact}
          onOpen={openSection}
          onPreviewChange={setActivePreview}
          selectedAngle={
            SELECTED_PETAL_ANGLE
          }
        />
      </div>

      <span className="sr-only" aria-live="polite">
        {current ? `${current.label} section` : "Portfolio home"}
      </span>
    </main>
  );
}
