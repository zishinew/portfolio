"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  memo,
  useCallback,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useSiteReveal } from "@/components/SiteRevealContext";
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
  spinOnOpen?: boolean;
  selectedAngle?: number;
  /** fade the inked flower into the paper at the edges (homepage hero) */
  edgeFade?: boolean;
}

function MechanicalFlower({
  onPreviewChange,
  onNavigate,
  onOpen,
  spinOnOpen = false,
  selectedAngle = 90,
  edgeFade = false,
}: MechanicalFlowerProps) {
  const frostClipId = `flower-frost-${useId().replaceAll(":", "")}`;
  const { playClick, playSpecialClick } = useSoundEffects();
  const isSiteRevealed = useSiteReveal();
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
  const selectedPetal = petals[selection.index];

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
    playSpecialClick();
    onPreviewChange?.(selectedPetal.id);

    if (spinOnOpen) {
      setManualSelection({
        pathname,
        index: selection.index,
        rotation: selection.rotation + 360,
        selectedAngle,
      });
    }

    if (onOpen) {
      onOpen(selectedPetal.id);
      return;
    }
    router.push(selectedPetal.href);
  }, [
    onOpen,
    onPreviewChange,
    pathname,
    playSpecialClick,
    router,
    selectedAngle,
    selectedPetal.href,
    selectedPetal.id,
    selection.index,
    selection.rotation,
    spinOnOpen,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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
        changePetal(-1);
        return;
      }

      if (["arrowdown", "arrowright", "s", "d"].includes(key)) {
        event.preventDefault();
        changePetal(1);
        return;
      }

      if (event.key === "Enter") {
        if (
          target instanceof HTMLElement &&
          !target.closest(".mechanical-flower-nav, .mechanical-flower__controls") &&
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
  }, [changePetal, openSelectedPetal]);

  const handlePetalClick = (
    event: MouseEvent<HTMLAnchorElement>,
    index: number,
  ) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    if (index !== selection.index) {
      event.preventDefault();
      return;
    }

    if (onOpen) {
      event.preventDefault();
      openSelectedPetal();
      return;
    }

    playClick();
    onPreviewChange?.(selectedPetal.id);
  };

  return (
    <nav
      className="mechanical-flower-nav"
      aria-label="Portfolio sections"
      style={{ "--flower-rotation": `${selection.rotation}deg` } as CSSProperties}
    >
      {edgeFade && (
        <>
          <svg
            className="mechanical-flower__glass-defs"
            width="0"
            height="0"
            aria-hidden
            focusable="false"
          >
            <defs>
              <clipPath id={frostClipId} clipPathUnits="objectBoundingBox">
                <g transform="scale(0.0014285714) translate(-150 -150)">
                  {petals.map((petal) => (
                    <path
                      key={petal.href}
                      d={PETAL_PATH}
                      transform={`rotate(${petal.rotation} 500 500)`}
                    />
                  ))}
                </g>
              </clipPath>
            </defs>
          </svg>
          <div
            className="mechanical-flower__glass"
            style={{
              clipPath: `url(#${frostClipId})`,
              WebkitClipPath: `url(#${frostClipId})`,
            }}
            aria-hidden
          />
        </>
      )}

      {/* unmasked paper silhouette under the ink — damps fixed decals/textures
          so only a faint ghost shows through edge-faded petals */}
      <div
        className="mechanical-flower__rotor mechanical-flower__silhouette"
        aria-hidden
      >
        <svg className="mechanical-flower" viewBox="150 150 700 700">
          {petals.map((petal) => (
            <path
              key={petal.href}
              className="mechanical-flower__petal-backdrop"
              d={PETAL_PATH}
              transform={`rotate(${petal.rotation} 500 500)`}
            />
          ))}
          <circle className="mechanical-flower__hub-gap" cx="500" cy="500" r="58" />
        </svg>
      </div>

      <div className="mechanical-flower__ink">
        {/* nested single-mask wrappers — see .mechanical-flower__fade in globals.css */}
        <div className={`mechanical-flower__fade${edgeFade ? " mechanical-flower__fade--y" : ""}`}>
          <div className={`mechanical-flower__fade${edgeFade ? " mechanical-flower__fade--x" : ""}`}>
            <div className="mechanical-flower__rotor">
              <svg className="mechanical-flower" viewBox="150 150 700 700">
                <g>
                  {petals.map((petal, index) => (
                    <Link
                      key={petal.href}
                      href={petal.href}
                      data-section={petal.id}
                      className={`mechanical-flower__link ${index === selection.index ? "is-selected" : ""}`}
                      aria-label={petal.label}
                      aria-current={index === routeIndex ? "page" : undefined}
                      aria-disabled={index !== selection.index}
                      tabIndex={index === selection.index ? 0 : -1}
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
                    </Link>
                  ))}

                  <circle className="mechanical-flower__hub-gap" cx="500" cy="500" r="58" />
                  <circle className="mechanical-flower__hub" cx="500" cy="500" r="46" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {isBrowser && isSiteRevealed &&
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
