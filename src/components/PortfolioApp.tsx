"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import HomeView from "@/components/HomeView";
import MechanicalFlower from "@/components/MechanicalFlower";
import PortfolioSectionView from "@/components/PortfolioPage";
import { useSoundEffects } from "@/hooks/useSoundEffects";
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

function titleForSection(section: PortfolioSection | null) {
  return section
    ? `${getPortfolioSection(section).label.toLowerCase()} — zishine wang`
    : "zishine wang — archive";
}

export default function PortfolioApp({
  initialSection,
}: {
  initialSection: PortfolioSection | null;
}) {
  const { playSpecialClick } = useSoundEffects();
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

  const [isFlowerHomePositioned, setIsFlowerHomePositioned] = useState(
    initialSection === null,
  );
  const isFlowerHomePositionedRef = useRef(initialSection === null);
  const flowerMenuRef = useRef<HTMLDivElement>(null);
  const flowerStartRectRef = useRef<DOMRect | undefined>(undefined);

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
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const end = flowerMenu.getBoundingClientRect();
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

    return () => animation.cancel();
  }, [isFlowerHomePositioned]);

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

      document.title = titleForSection(nextSection);
    },
    [],
  );

  const openSection = useCallback(
    (nextSection: PortfolioSection) => {
      setActivePreview(nextSection);
      moveFlowerTo(false);
      showSection(nextSection, "push");
    },
    [moveFlowerTo, showSection],
  );

  const returnHome = useCallback(() => {
    setActivePreview("about");
    moveFlowerTo(true);
    showSection(null, "push");
  }, [moveFlowerTo, showSection]);

  const moveFlowerHome = useCallback(() => {
    moveFlowerTo(true);
    return SELECTED_PETAL_ANGLE;
  }, [moveFlowerTo]);

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
      }
      moveFlowerTo(nextSection === null);
      showSection(nextSection, "none");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [moveFlowerTo, showSection]);

  useEffect(() => {
    return () => window.clearTimeout(contentTimerRef.current);
  }, []);

  const isHome = activeSection === null;
  const isSubpageMenuActive = !isHome && isFlowerHomePositioned;
  const current = activeSection
    ? getPortfolioSection(activeSection)
    : null;

  return (
    <main
      className="portfolio-app relative h-[100svh] w-full overflow-hidden font-garamond text-ac-bone"
      onClickCapture={handleLinkClickCapture}
    >
      <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-4 font-mono text-[10px] uppercase tracking-[0.25em] text-ac-ash sm:px-8">
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
        <HomeView activePreview={activePreview} isActive={isHome} />
      </div>

      <div
        className="portfolio-live-layer portfolio-section-layer"
        data-state={isHome ? "inactive" : "active"}
        data-menu-active={isSubpageMenuActive}
        aria-hidden={isHome}
      >
        <div className="portfolio-page-grid relative z-10 mx-auto grid h-[100svh] max-w-[1600px] overflow-hidden lg:grid-cols-[minmax(420px,42vw)_1fr]">
          <div className="portfolio-flower-panel relative hidden lg:block" aria-hidden />

          <section className="relative flex h-[100svh] items-center overflow-hidden px-5 pb-72 pt-24 sm:px-10 sm:pb-80 lg:px-12 lg:py-24 xl:px-16">
            <div
              className="portfolio-content-stack relative w-full max-w-5xl"
              style={{
                filter: isSubpageMenuActive ? "blur(5px)" : "none",
                opacity: isSubpageMenuActive ? 0.38 : 1,
                pointerEvents: isSubpageMenuActive ? "none" : "auto",
                userSelect: isSubpageMenuActive ? "none" : "auto",
                transition:
                  "filter 360ms cubic-bezier(0.22, 1, 0.36, 1), opacity 280ms ease-out",
              }}
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

      {!isHome && (
        <button
          type="button"
          onClick={returnHome}
          className="group fixed bottom-16 left-5 z-40 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.28em] text-ac-ash transition-colors hover:text-ac-halo focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-ac-frost sm:left-8"
          aria-label="Back to portfolio home"
        >
          <span
            className="transition-transform duration-300 group-hover:-translate-x-1"
            aria-hidden
          >
            ←
          </span>
          <span>back to home</span>
        </button>
      )}

      <div
        ref={flowerMenuRef}
        className={`portfolio-flower-menu fixed bottom-4 left-4 h-52 w-52 sm:h-60 sm:w-60 lg:bottom-auto lg:left-[1vw] lg:top-1/2 lg:h-[40vw] lg:max-h-[650px] lg:min-h-[420px] lg:w-[40vw] lg:max-w-[650px] lg:min-w-[420px] lg:-translate-y-1/2 ${isHome ? "z-[6]" : "z-30"}${isFlowerHomePositioned ? " is-home-positioned" : ""}`}
        aria-label="Portfolio menu"
      >
        <MechanicalFlower
          edgeFade={isFlowerHomePositioned}
          onNavigate={moveFlowerHome}
          onOpen={openSection}
          onPreviewChange={setActivePreview}
          spinOnOpen={isHome}
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
