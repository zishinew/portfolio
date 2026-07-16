"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  memo,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type AnimationEvent as ReactAnimationEvent,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useSiteRevealPhase } from "@/components/SiteRevealContext";
import {
  portfolioSections,
  type PortfolioSection,
} from "@/lib/portfolio";

export type { PortfolioSection } from "@/lib/portfolio";

const PETAL_PATH =
  "M 460 170 C 475 161 485 184 500 184 C 515 184 525 161 540 170 C 575 190 596 250 596 305 C 596 350 572 380 548 411 C 530 435 516 452 511 468 L 489 468 C 484 452 470 435 452 411 C 428 380 404 350 404 305 C 404 250 425 190 460 170 Z";

const petals = portfolioSections.map((section, index) => ({
  ...section,
  rotation: index * 72,
  href: `/${section.id}`,
}));

const subscribeToBrowser = () => () => {};

interface MechanicalFlowerProps {
  onPreviewChange?: (section: PortfolioSection) => void;
  onNavigate?: () => number | undefined;
  onOpen?: (section: PortfolioSection) => void;
  selectedAngle?: number;
  introState?: "hidden" | "entering" | "visible";
  onIntroComplete?: () => void;
}

function MechanicalFlower({
  onPreviewChange,
  onNavigate,
  onOpen,
  selectedAngle = 90,
  introState = "visible",
  onIntroComplete,
}: MechanicalFlowerProps) {
  const { playClick, playSpecialClick } = useSoundEffects();
  const siteRevealPhase = useSiteRevealPhase();
  const isInteractive = siteRevealPhase === "complete";
  const pathname = usePathname();
  const router = useRouter();
  const isBrowser = useSyncExternalStore(
    subscribeToBrowser,
    () => true,
    () => false,
  );
  const routeIndex = petals.findIndex((petal) => pathname === petal.href);
  const routeSelection = {
    index: routeIndex >= 0 ? routeIndex : 0,
    rotation:
      routeIndex >= 0 ? selectedAngle - routeIndex * 72 : selectedAngle,
  };
  const [manualSelection, setManualSelection] = useState<
    {
      pathname: string;
      index: number;
      rotation: number;
      selectedAngle: number;
    } | undefined
  >();
  const manualSelectionMatchesPath =
    manualSelection?.pathname === pathname ||
    (manualSelection !== undefined &&
      petals[manualSelection.index].href === pathname);
  const selection = manualSelectionMatchesPath && manualSelection
    ? {
        ...manualSelection,
        rotation:
          manualSelection.rotation +
          selectedAngle - manualSelection.selectedAngle,
      }
    : routeSelection;
  const openPetalAtIndex = useCallback((index: number) => {
    const petal = petals[index];
    playSpecialClick();

    if (onOpen) {
      onOpen(petal.id);
      return;
    }

    onPreviewChange?.(petal.id);
    router.push(petal.href);
  }, [onOpen, onPreviewChange, playSpecialClick, router]);

  const changePetal = useCallback((direction: -1 | 1) => {
    const nextSelectedAngle = onNavigate?.() ?? selectedAngle;
    const nextIndex =
      (selection.index + direction + petals.length) % petals.length;
    const nextRotation =
      selection.rotation + nextSelectedAngle - selectedAngle - direction * 72;

    setManualSelection({
      pathname,
      index: nextIndex,
      rotation: nextRotation,
      selectedAngle: nextSelectedAngle,
    });
    onPreviewChange?.(petals[nextIndex].id);
    playClick();
  }, [onNavigate, onPreviewChange, pathname, playClick, selectedAngle, selection.index, selection.rotation]);

  const openSelectedPetal = useCallback(() => {
    openPetalAtIndex(selection.index);
  }, [openPetalAtIndex, selection.index]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isInteractive) {
        return;
      }

      if (event.defaultPrevented || event.metaKey || event.altKey || event.ctrlKey) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName))
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      if (["arrowup", "arrowleft", "w", "a"].includes(key)) {
        event.preventDefault();
        if (
          target instanceof HTMLElement &&
          target.closest("a, button, [role='button'], [role='link']") &&
          !target.closest(".mechanical-flower-nav, .mechanical-flower__controls")
        ) {
          target.blur();
        }
        changePetal(-1);
        return;
      }

      if (["arrowdown", "arrowright", "s", "d"].includes(key)) {
        event.preventDefault();
        if (
          target instanceof HTMLElement &&
          target.closest("a, button, [role='button'], [role='link']") &&
          !target.closest(".mechanical-flower-nav, .mechanical-flower__controls")
        ) {
          target.blur();
        }
        changePetal(1);
        return;
      }

      if (event.key === "Enter") {
        if (
          target instanceof HTMLElement &&
          target.closest("a, button, [role='button'], [role='link']")
        ) {
          return;
        }

        event.preventDefault();
        openSelectedPetal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [changePetal, isInteractive, openSelectedPetal]);

  const handlePetalClick = (
    event: MouseEvent<HTMLAnchorElement>,
    index: number,
  ) => {
    if (!isInteractive) {
      event.preventDefault();
      return;
    }

    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();

    if (index !== selection.index) {
      const baseTargetRotation = selectedAngle - petals[index].rotation;
      const rawDelta = baseTargetRotation - selection.rotation;
      const shortestDelta =
        ((((rawDelta + 180) % 360) + 360) % 360) - 180;

      setManualSelection({
        pathname,
        index,
        rotation: selection.rotation + shortestDelta,
        selectedAngle,
      });
    }

    openPetalAtIndex(index);
  };

  const handleIntroAnimationEnd = (
    event: ReactAnimationEvent<HTMLDivElement>,
  ) => {
    if (
      event.target === event.currentTarget &&
      event.animationName === "homeFlowerIntro"
    ) {
      onIntroComplete?.();
    }
  };

  return (
    <nav
      className="mechanical-flower-nav"
      aria-label="Portfolio sections"
      aria-hidden={introState === "hidden"}
      style={{ "--flower-rotation": `${selection.rotation}deg` } as CSSProperties}
    >
      <div
        className={`mechanical-flower__ink${introState === "entering" ? " is-intro-entering" : ""}`}
        data-intro-state={introState}
        onAnimationEnd={handleIntroAnimationEnd}
      >
        <div className="mechanical-flower__rotor">
          <svg className="mechanical-flower" viewBox="150 150 700 700">
            <g>
              {petals.map((petal, index) => (
                <a
                  key={petal.href}
                  href={petal.href}
                  data-section={petal.id}
                  className={`mechanical-flower__link ${index === selection.index ? "is-selected" : ""}`}
                  aria-label={petal.label}
                  aria-current={index === routeIndex ? "page" : undefined}
                  aria-disabled={!isInteractive}
                  tabIndex={isInteractive ? 0 : -1}
                  onClick={(event) => handlePetalClick(event, index)}
                >
                  <g transform={`rotate(${petal.rotation} 500 500)`}>
                    <g className="mechanical-flower__petal-content">
                      <path
                        className="mechanical-flower__petal-backdrop"
                        d={PETAL_PATH}
                      />
                      <g className="mechanical-flower__petal-ink">
                        <path
                          className="mechanical-flower__petal"
                          d={PETAL_PATH}
                        />
                        <path
                          className="mechanical-flower__inner-line"
                          d="M 500 452 L 500 365"
                        />
                        <circle
                          className="mechanical-flower__inner-circle"
                          cx="500"
                          cy="345"
                          r="19"
                        />
                      </g>
                    </g>
                    <text
                      className="mechanical-flower__label"
                      x="500"
                      y="245"
                      textAnchor="middle"
                      style={
                        {
                          "--label-rotation": `${-(selection.rotation + petal.rotation)}deg`,
                        } as CSSProperties
                      }
                    >
                      {petal.label.toLowerCase()}
                    </text>
                  </g>
                </a>
              ))}

              <circle
                className="mechanical-flower__hub-gap"
                cx="500"
                cy="500"
                r="58"
              />
              <circle
                className="mechanical-flower__hub"
                cx="500"
                cy="500"
                r="46"
              />
            </g>
          </svg>
        </div>
      </div>

      {isBrowser && isInteractive &&
        createPortal(
          <div className="mechanical-flower__controls" aria-label="Change selected petal">
            <p className="mechanical-flower__prompt">
              arrows / wasd to choose · enter to open
            </p>
            <button
              type="button"
              aria-label="Select previous petal"
              onClick={() => changePetal(-1)}
            >
              <span aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Select next petal"
              onClick={() => changePetal(1)}
            >
              <span aria-hidden="true" />
            </button>
          </div>,
          document.body,
        )}

      <span className="sr-only" aria-live="polite">
        {petals[selection.index].label} selected
      </span>
    </nav>
  );
}

export default memo(MechanicalFlower);
