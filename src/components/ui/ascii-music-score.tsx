"use client";

import {
  memo,
  useEffect,
  useRef,
  type AnimationEvent as ReactAnimationEvent,
} from "react";
import { useMusicTimeline } from "@/components/MusicContext";

const TAU = Math.PI * 2;

// The ascii glyphs stay this size at every scale — a bigger score means more
// symbols, never larger ones.
const FONT_SIZE = 13;
const STAFF_STEP = 5; // dash spacing; hyphens nearly touch, reading as a line
const CHAR_COL = 8; // horizontal pitch when filling shapes with characters
const CHAR_ROW = 12; // vertical pitch when filling shapes with characters
const STEM_COL_GAP = 6; // stems are two character columns wide
const STEM_ROW = 9; // overlapping pipes read as a solid stem

const IDLE_SPEED_FACTOR = 1;
const PLAYING_SPEED_FACTOR = 1.7;
const SPEED_EASE_SECONDS = 1.2;
const MAX_FRAME_DELTA_MS = 100;

const STAFF_ALPHA = 0.5;
const NOTE_ALPHA = 0.75;

// Notes bob and sway gently on the wavy staff like boats on water; beamed
// groups rock because each head bobs slightly out of phase.
const NOTE_BOB_FACTOR = 0.09; // × spacing, vertical
const NOTE_SWAY_FACTOR = 0.35; // × bob amplitude, horizontal
const NOTE_BOB_GROUP_PHASE = 0.85; // per-head phase offset within a group

// Cursor repulsion: glyphs within the radius are pushed radially away with a
// squared falloff (zero force and zero slope at the rim, so nothing snaps).
const REPEL_RADIUS_FACTOR = 2.0; // × spacing
const REPEL_STRENGTH_FACTOR = 0.5; // × spacing, at the cursor
const POINTER_EASE_SECONDS = 0.06;
const REPEL_EASE_SECONDS = 0.16;

interface AsciiMusicScoreProps {
  className?: string;
  revealState?: "hidden" | "entering" | "visible";
  playing?: boolean;
  staffColor?: string;
  noteColor?: string;
  onRevealComplete?: () => void;
}

interface ScoreElement {
  kind:
    | "quarter"
    | "dottedQuarter"
    | "half"
    | "eighthPair"
    | "sixteenthRun"
    | "bar";
  x: number; // world-space anchor; screen x = x - scrollX
  width: number;
  pitches: number[]; // per head, in half-steps from the middle staff line
  bobPhase: number;
  bobRate: number; // rad/s
}

interface PatternChar {
  dx: number;
  dy: number;
  glyph: string;
}

let resolvedFontStack: string | null = null;

function resolveFontStack() {
  if (resolvedFontStack) {
    return resolvedFontStack;
  }

  // canvas context.font cannot read CSS variables, and next/font registers
  // Space Mono under a scoped family name, so resolve the themed stack once.
  const monoStack = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--font-mono")
    .trim();

  resolvedFontStack = monoStack || "ui-monospace, monospace";
  return resolvedFontStack;
}

export const AsciiMusicScore = memo(function AsciiMusicScore({
  className,
  revealState = "visible",
  playing = false,
  // The treble-clef decal draws in #44474d; the score sits just shy of it.
  staffColor = "#44474d",
  noteColor = "#44474d",
  onRevealComplete,
}: AsciiMusicScoreProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playingRef = useRef(playing);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;

    if (!container || !canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const font = `${FONT_SIZE}px ${resolveFontStack()}`;
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const finePointerQuery = window.matchMedia("(pointer: fine)");

    let disposed = false;
    let animationFrame = 0;
    let previousTimestamp = 0;
    let simTime = 0;
    let scrollX = 0;
    let speedFactor = IDLE_SPEED_FACTOR;
    let width = 0;
    let height = 0;

    // Scale-dependent metrics, derived from the treble-clef decal so the
    // staff reads as the sheet the clef sits on. All set in syncSize().
    let spacing = 0; // distance between adjacent staff lines
    let halfStep = 0; // pitch step: line → space → line
    let stemLength = 0;
    let scrollSpeed = 0;
    let clefRight = 0; // where the decal ends and the notes begin
    let headFillSprite: HTMLCanvasElement | null = null;
    let headOpenSprite: HTMLCanvasElement | null = null;
    let dotSprite: HTMLCanvasElement | null = null;
    // The source patterns stay around so heads inside the repulsion field
    // can be drawn character by character instead of as one sprite.
    let headFillPattern: PatternChar[] = [];
    let headOpenPattern: PatternChar[] = [];
    let dotPattern: PatternChar[] = [];

    const strip = document.createElement("canvas");
    const stripContext = strip.getContext("2d");
    let stripHeight = 0;
    let stripDrawnAt = -1;

    // All five lines pre-composited; the per-frame cost is one drawImage.
    const staffCanvas = document.createElement("canvas");
    const staffCanvasContext = staffCanvas.getContext("2d");
    let staffBandHeight = 0;

    // Shapes are stamped as grids of characters; the grid rides each shape's
    // fractional position, so motion stays perfectly smooth.
    const buildEllipsePattern = (open: boolean): PatternChar[] => {
      const radiusX = 0.74 * spacing;
      const radiusY = 0.5 * spacing;
      const tilt = -0.32;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);
      const reach = Math.ceil(Math.max(radiusX, radiusY));
      const pattern: PatternChar[] = [];

      for (let gy = -reach; gy <= reach; gy += CHAR_ROW) {
        for (let gx = -reach; gx <= reach; gx += CHAR_COL) {
          const u = (gx * cosT + gy * sinT) / radiusX;
          const v = (-gx * sinT + gy * cosT) / radiusY;
          const d = u * u + v * v;

          if (d > 1) {
            continue;
          }

          if (open) {
            if (d >= 0.4) {
              pattern.push({ dx: gx, dy: gy, glyph: d > 0.72 ? "#" : "o" });
            }
          } else {
            pattern.push({
              dx: gx,
              dy: gy,
              glyph: d < 0.3 ? "@" : d < 0.7 ? "#" : "*",
            });
          }
        }
      }

      return pattern;
    };

    const buildDotPattern = (): PatternChar[] => {
      const radius = 0.16 * spacing;
      const pattern: PatternChar[] = [];
      for (let gy = -radius; gy <= radius; gy += CHAR_ROW) {
        for (let gx = -radius; gx <= radius; gx += CHAR_COL) {
          if (gx * gx + gy * gy <= radius * radius) {
            pattern.push({ dx: gx, dy: gy, glyph: "@" });
          }
        }
      }
      return pattern.length > 0 ? pattern : [{ dx: 0, dy: 0, glyph: "@" }];
    };

    // Head and dot patterns are stamped dozens of times per frame; baking
    // each into a small sprite turns ~100 fillText calls into one drawImage.
    const bakeSprite = (pattern: PatternChar[], pixelRatio: number) => {
      let reach = 0;
      for (const item of pattern) {
        reach = Math.max(reach, Math.abs(item.dx), Math.abs(item.dy));
      }
      const size = 2 * (reach + FONT_SIZE);
      const sprite = document.createElement("canvas");
      sprite.width = Math.max(1, Math.round(size * pixelRatio));
      sprite.height = sprite.width;
      const spriteContext = sprite.getContext("2d");
      if (spriteContext) {
        spriteContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        spriteContext.font = font;
        spriteContext.textAlign = "center";
        spriteContext.textBaseline = "middle";
        spriteContext.fillStyle = noteColor;
        for (const item of pattern) {
          spriteContext.fillText(item.glyph, size / 2 + item.dx, size / 2 + item.dy);
        }
      }
      return sprite;
    };

    const stamp = (
      sprite: HTMLCanvasElement | null,
      pattern: PatternChar[],
      cx: number,
      cy: number,
    ) => {
      if (!sprite) {
        return;
      }
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const size = sprite.width / pixelRatio;

      // Inside the field, each character disperses on its own; the sprite
      // fast path only runs where the field cannot reach any of them.
      if (repelStrength > 0.01) {
        const reach = REPEL_RADIUS_FACTOR * spacing + size / 2;
        const relX = cx - pointerX;
        const relY = cy - pointerY;
        if (relX * relX + relY * relY < reach * reach) {
          for (const item of pattern) {
            computeRepel(cx + item.dx, cy + item.dy);
            context.fillText(
              item.glyph,
              cx + item.dx + repelDx,
              cy + item.dy + repelDy,
            );
          }
          return;
        }
      }

      context.drawImage(
        sprite,
        0,
        0,
        sprite.width,
        sprite.height,
        cx - size / 2,
        cy - size / 2,
        size,
        size,
      );
    };

    // The middle staff line's vertical position. Deterministic in (x, t) so
    // every staff line and notation element rides the exact same curve.
    const staffMidY = (x: number, t: number) =>
      height / 2 +
      0.45 * spacing * Math.sin((x / 1100) * TAU + t * 0.32) +
      0.2 * spacing * Math.sin((x / 520) * TAU - t * 0.2 + 1.7) +
      0.08 * spacing * Math.sin((x / 260) * TAU + t * 0.44 + 4.2);

    // --- endless score generation (a melodic random walk of measures) ---

    const elements: ScoreElement[] = [];
    let nextX = 0;
    let lastPitch = 0;
    let notesLeftInMeasure = 3;

    const nextPitch = () => {
      // Random walk over the staff: ±4 are the outer lines, ±5 just outside.
      const steps = [-2, -1, -1, 1, 1, 2];
      lastPitch = Math.max(
        -5,
        Math.min(5, lastPitch + steps[Math.floor(Math.random() * steps.length)]),
      );
      return lastPitch;
    };

    const appendElement = () => {
      // Every note gets its own bob rhythm; bar lines stay glued to the staff.
      const bob = {
        bobPhase: Math.random() * TAU,
        bobRate: 1.0 + Math.random() * 0.8,
      };

      if (notesLeftInMeasure <= 0) {
        elements.push({
          kind: "bar",
          x: nextX,
          width: 1.6 * spacing,
          pitches: [],
          ...bob,
        });
        nextX += 1.6 * spacing;
        notesLeftInMeasure = 3 + Math.floor(Math.random() * 2);
        return;
      }

      const roll = Math.random();
      let element: ScoreElement;

      if (roll < 0.26) {
        element = {
          kind: "quarter",
          x: nextX,
          width: 3.0 * spacing,
          pitches: [nextPitch()],
          ...bob,
        };
      } else if (roll < 0.44) {
        element = {
          kind: "half",
          x: nextX,
          width: 3.6 * spacing,
          pitches: [nextPitch()],
          ...bob,
        };
      } else if (roll < 0.58) {
        element = {
          kind: "dottedQuarter",
          x: nextX,
          width: 3.4 * spacing,
          pitches: [nextPitch()],
          ...bob,
        };
      } else if (roll < 0.86) {
        element = {
          kind: "eighthPair",
          x: nextX,
          width: 4.6 * spacing,
          pitches: [nextPitch(), nextPitch()],
          ...bob,
        };
      } else {
        element = {
          kind: "sixteenthRun",
          x: nextX,
          width: 7.0 * spacing,
          pitches: [nextPitch(), nextPitch(), nextPitch(), nextPitch()],
          ...bob,
        };
      }

      elements.push(element);
      nextX += element.width;
      notesLeftInMeasure -= 1;
    };

    const ensureElements = () => {
      const margin = 2 * spacing;
      while (nextX < scrollX + width + margin) {
        appendElement();
      }
      while (
        elements.length > 0 &&
        elements[0].x + elements[0].width < scrollX - margin
      ) {
        elements.shift();
      }
    };

    const rebuildElements = () => {
      elements.length = 0;
      nextX = scrollX + clefRight + spacing;
      notesLeftInMeasure = 3;
      ensureElements();
    };

    // --- edge fades ---

    // On the home view the hero picture deck occupies the right half and its
    // images blend to white along their left edge; the score fades out across
    // that same zone so the two hand off gradually. Absent deck → no fade.
    let deckFadeStart = Infinity;
    let deckFadeEnd = Infinity;
    let lastDeckPollAt = -1;

    // The treble-clef decal rides the same wave: translated by the staff's
    // height and tilted by its slope at the clef's own x. Composed via the
    // transform property, which stacks after Tailwind's standalone translate.
    let clefElement: HTMLElement | null = null;

    const syncClefTilt = (t: number) => {
      if (!clefElement) {
        return;
      }
      const clefCenterX = clefRight / 2;
      // The wave dominates the lift so the clef visibly rides the swells;
      // a small bob floats on top, and the tilt follows the local slope.
      const lift =
        (staffMidY(clefCenterX, t) - height / 2) * 1.15 +
        0.06 * spacing * Math.sin(t * 1.1 + 0.7);
      const slope =
        (staffMidY(clefCenterX + 60, t) - staffMidY(clefCenterX - 60, t)) / 120;
      const angle = Math.max(
        -0.07,
        Math.min(0.07, Math.atan(slope) * 0.45),
      );
      clefElement.style.transform = `translateY(${lift.toFixed(2)}px) rotate(${angle.toFixed(4)}rad)`;
    };

    const measureDeck = () => {
      if (!clefElement) {
        clefElement = document.querySelector<HTMLElement>(".site-ascii-layer");
        if (clefElement) {
          clefElement.style.willChange = "transform";
        }
      }
      const rect = document
        .querySelector(".hero-preview-deck")
        ?.getBoundingClientRect();
      const present = rect !== undefined && rect.width > 0 && rect.height > 0;
      // The ramp must live in the open space BEFORE the picture — inside the
      // deck the images are opaque and any fade there is invisible.
      const nextStart = present ? rect.left - Math.min(rect.width * 0.6, 380) : Infinity;
      const nextEnd = present ? rect.left + 30 : Infinity;

      if (nextStart !== deckFadeStart || nextEnd !== deckFadeEnd) {
        deckFadeStart = nextStart;
        deckFadeEnd = nextEnd;
        stripDrawnAt = -1; // re-bake the staff lines with the new fade
      }
    };

    const deckAlphaAt = (x: number) =>
      x <= deckFadeStart
        ? 1
        : Math.max(0, (deckFadeEnd - x) / (deckFadeEnd - deckFadeStart));

    const staffLineAlphaAt = (x: number) =>
      Math.max(
        0,
        Math.min(1, (x + 20) / 60, (width - x) / 60, deckAlphaAt(x)),
      );

    // Notes ride the staff all the way across and only let go at the very
    // left edge of the screen.
    const elementAlphaAt = (x: number) =>
      Math.max(
        0,
        Math.min(
          1,
          (x - 0.2 * spacing) / spacing,
          (width - x) / (1.2 * spacing),
          deckAlphaAt(x),
        ),
      );

    // --- cursor repulsion field ---

    let pointerTargetX = 0;
    let pointerTargetY = 0;
    let pointerX = 0;
    let pointerY = 0;
    let pointerSeeded = false;
    let pointerActive = false;
    let repelStrength = 0; // eased 0..1 so the field fades in and out

    // Field output goes through these to avoid allocating per glyph.
    let repelDx = 0;
    let repelDy = 0;

    const computeRepel = (x: number, y: number) => {
      repelDx = 0;
      repelDy = 0;

      if (repelStrength <= 0.01) {
        return;
      }

      const radius = REPEL_RADIUS_FACTOR * spacing;
      const relX = x - pointerX;
      const relY = y - pointerY;
      const distanceSq = relX * relX + relY * relY;

      if (distanceSq >= radius * radius || distanceSq === 0) {
        return;
      }

      const distance = Math.sqrt(distanceSq);
      const falloff = 1 - distance / radius;
      const push =
        repelStrength * REPEL_STRENGTH_FACTOR * spacing * falloff * falloff;
      repelDx = (relX / distance) * push;
      repelDy = (relY / distance) * push;
    };

    // --- notation drawing (all positions fractional px) ---

    // Alpha is applied per glyph at its own x, so wide groups fade through
    // the boundary limb by limb instead of popping in as a block.
    const applyNoteAlpha = (x: number) => {
      context.globalAlpha = elementAlphaAt(x) * NOTE_ALPHA;
    };

    const headOffsets = (element: ScoreElement): number[] => {
      if (element.kind === "eighthPair") {
        return [0.9 * spacing, 2.8 * spacing];
      }
      if (element.kind === "sixteenthRun") {
        return [0.9, 2.4, 3.9, 5.4].map((k) => k * spacing);
      }
      return [0.9 * spacing];
    };

    // Each pipe is displaced at its own position, so stems bend around the
    // cursor instead of shifting as rigid bars.
    const drawStem = (x: number, yFrom: number, yTo: number) => {
      applyNoteAlpha(x);
      const yStart = Math.min(yFrom, yTo);
      const yEnd = Math.max(yFrom, yTo);
      for (const column of [0, STEM_COL_GAP]) {
        for (let y = yStart; y < yEnd; y += STEM_ROW) {
          computeRepel(x + column, y);
          context.fillText("|", x + column + repelDx, y + repelDy);
        }
        computeRepel(x + column, yEnd);
        context.fillText("|", x + column + repelDx, yEnd + repelDy);
      }
    };

    const drawBeam = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      double: boolean,
    ) => {
      const rows = Math.max(2, Math.round((0.3 * spacing) / CHAR_ROW) + 1);
      const bands = double ? [0, 0.55 * spacing] : [0];
      for (const band of bands) {
        for (let x = x1; x <= x2; x += CHAR_COL - 1) {
          applyNoteAlpha(x);
          const yBase = y1 + ((x - x1) / (x2 - x1)) * (y2 - y1) + band;
          for (let row = 0; row < rows; row += 1) {
            const y = yBase + row * CHAR_ROW * 0.8;
            computeRepel(x, y);
            context.fillText("=", x + repelDx, y + repelDy);
          }
        }
      }
    };

    const drawSingleNote = (element: ScoreElement, screenX: number, t: number) => {
      const bobAmplitude = NOTE_BOB_FACTOR * spacing;
      const bob = bobAmplitude * Math.sin(t * element.bobRate + element.bobPhase);
      const sway =
        NOTE_SWAY_FACTOR *
        bobAmplitude *
        Math.sin(t * element.bobRate * 0.8 + element.bobPhase + 2.1);
      const headX = screenX + headOffsets(element)[0] + sway;
      const pitch = element.pitches[0];
      const headY = staffMidY(headX, t) - pitch * halfStep + bob;
      const up = pitch < 0; // below the middle line → stem up
      const stemX = headX + (up ? 0.62 * spacing : -0.62 * spacing - STEM_COL_GAP);
      const tipY = headY + (up ? -stemLength : stemLength);

      applyNoteAlpha(headX);
      if (element.kind === "half") {
        stamp(headOpenSprite, headOpenPattern, headX, headY);
      } else {
        stamp(headFillSprite, headFillPattern, headX, headY);
      }
      drawStem(stemX, up ? tipY : headY, up ? headY : tipY);

      if (element.kind === "dottedQuarter") {
        applyNoteAlpha(headX + 1.1 * spacing);
        stamp(dotSprite, dotPattern, headX + 1.1 * spacing, headY - 0.2 * spacing);
      }
    };

    const drawBeamedGroup = (element: ScoreElement, screenX: number, t: number) => {
      const offsets = headOffsets(element);
      const bobAmplitude = NOTE_BOB_FACTOR * spacing;
      const sway =
        NOTE_SWAY_FACTOR *
        bobAmplitude *
        Math.sin(t * element.bobRate * 0.8 + element.bobPhase + 2.1);
      const headXs = offsets.map((offset) => screenX + offset + sway);
      // Heads bob out of phase, so the group rocks and its beam tilts.
      const headYs = headXs.map(
        (headX, index) =>
          staffMidY(headX, t) -
          element.pitches[index] * halfStep +
          bobAmplitude *
            Math.sin(
              t * element.bobRate +
                element.bobPhase +
                index * NOTE_BOB_GROUP_PHASE,
            ),
      );
      const averagePitch =
        element.pitches.reduce((sum, pitch) => sum + pitch, 0) /
        element.pitches.length;
      const up = averagePitch < 0;
      const stemXs = headXs.map(
        (headX) => headX + (up ? 0.62 * spacing : -0.62 * spacing - STEM_COL_GAP),
      );

      // Beam runs between the outer stem tips, with the slant capped and the
      // whole beam pushed out until it clears every head in the group.
      let beamY1 = headYs[0] + (up ? -stemLength : stemLength);
      let beamY2 = headYs[headYs.length - 1] + (up ? -stemLength : stemLength);
      const slant = beamY2 - beamY1;
      const maxSlant = 0.8 * spacing;
      if (Math.abs(slant) > maxSlant) {
        const middle = (beamY1 + beamY2) / 2;
        beamY1 = middle - (Math.sign(slant) * maxSlant) / 2;
        beamY2 = middle + (Math.sign(slant) * maxSlant) / 2;
      }

      const spanX = stemXs[stemXs.length - 1] - stemXs[0];
      const beamYAt = (x: number) =>
        beamY1 + ((x - stemXs[0]) / spanX) * (beamY2 - beamY1);

      const clearance = 1.3 * spacing;
      let shift = 0;
      headYs.forEach((headY, index) => {
        const room = up
          ? headY - clearance - beamYAt(stemXs[index])
          : beamYAt(stemXs[index]) - headY - clearance;
        if (room < 0) {
          shift = Math.max(shift, -room);
        }
      });
      beamY1 += up ? -shift : shift;
      beamY2 += up ? -shift : shift;

      headXs.forEach((headX, index) => {
        applyNoteAlpha(headX);
        stamp(headFillSprite, headFillPattern, headX, headYs[index]);
        const stemX = stemXs[index];
        drawStem(
          stemX,
          up ? beamYAt(stemX) : headYs[index],
          up ? headYs[index] : beamYAt(stemX),
        );
      });

      drawBeam(
        stemXs[0],
        up ? beamY1 : beamY1 - 0.3 * spacing,
        stemXs[stemXs.length - 1],
        up ? beamY2 : beamY2 - 0.3 * spacing,
        element.kind === "sixteenthRun",
      );
    };

    const drawBar = (element: ScoreElement, screenX: number, t: number) => {
      const x = screenX + 0.8 * spacing;
      const middleY = staffMidY(x, t);
      drawStem(x, middleY - 2 * spacing, middleY + 2 * spacing);
    };

    const draw = (t: number) => {
      context.clearRect(0, 0, width, height);

      if (width === 0 || height === 0 || !stripContext || !staffCanvasContext) {
        return;
      }

      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = font;

      // One staff line: dense dashes riding the wave, tildes on the swells.
      // Rendered to an offscreen strip, blitted five times into the staff
      // canvas at the line offsets. The bake runs at 30Hz — enough for the
      // wave's drift — and each frame pays a single staff drawImage.
      if (t - stripDrawnAt >= 1 / 30 || stripDrawnAt < 0) {
        stripDrawnAt = t;
        stripContext.clearRect(0, 0, width, stripHeight);
        stripContext.textAlign = "center";
        stripContext.textBaseline = "middle";
        stripContext.font = font;
        stripContext.fillStyle = staffColor;
        for (let x = 4; x < width; x += STAFF_STEP) {
          const edge = staffLineAlphaAt(x);
          if (edge <= 0.02) {
            continue;
          }

          const y = staffMidY(x, t);
          const dy = staffMidY(x + STAFF_STEP, t) - y;
          const glyph = Math.abs(dy) > 2.2 ? (dy < 0 ? "/" : "\\") : Math.abs(dy) > 0.9 ? "~" : "=";

          // Each glyph is struck three times, 3px apart, fattening the stroke.
          stripContext.globalAlpha = edge * STAFF_ALPHA;
          const stripY = y - height / 2 + stripHeight / 2;
          stripContext.fillText(glyph, x, stripY);
          stripContext.fillText(glyph, x, stripY + 3);
          stripContext.fillText(glyph, x, stripY + 6);
        }
        stripContext.globalAlpha = 1;

        staffCanvasContext.clearRect(0, 0, width, staffBandHeight);
        for (let line = -2; line <= 2; line += 1) {
          staffCanvasContext.drawImage(
            strip,
            0,
            0,
            strip.width,
            strip.height,
            0,
            staffBandHeight / 2 - stripHeight / 2 + line * spacing,
            width,
            stripHeight,
          );
        }
      }

      context.drawImage(
        staffCanvas,
        0,
        0,
        staffCanvas.width,
        staffCanvas.height,
        0,
        height / 2 - staffBandHeight / 2,
        width,
        staffBandHeight,
      );

      // Around the cursor the baked staff is cleared and its glyphs redrawn
      // live with the repulsion applied per glyph and per line. The redraw
      // uses the bake's own timestamp, so the seam at the window's edges is
      // exact — displacement is already zero there.
      if (repelStrength > 0.01) {
        const windowReach = REPEL_RADIUS_FACTOR * spacing + 24;
        const bandTop = height / 2 - staffBandHeight / 2;
        const windowLeft = Math.max(0, pointerX - windowReach);
        const windowRight = Math.min(width, pointerX + windowReach);

        if (windowRight > windowLeft) {
          context.clearRect(
            windowLeft,
            bandTop,
            windowRight - windowLeft,
            staffBandHeight,
          );
          context.fillStyle = staffColor;

          const tBaked = stripDrawnAt;
          const firstColumn =
            4 + Math.ceil((windowLeft - 4) / STAFF_STEP) * STAFF_STEP;

          for (let x = firstColumn; x < windowRight; x += STAFF_STEP) {
            const edge = staffLineAlphaAt(x);
            if (edge <= 0.02) {
              continue;
            }

            const y = staffMidY(x, tBaked);
            const dy = staffMidY(x + STAFF_STEP, tBaked) - y;
            const glyph = Math.abs(dy) > 2.2 ? (dy < 0 ? "/" : "\\") : Math.abs(dy) > 0.9 ? "~" : "=";

            context.globalAlpha = edge * STAFF_ALPHA;
            for (let line = -2; line <= 2; line += 1) {
              const lineY = y + line * spacing;
              computeRepel(x, lineY);
              const glyphX = x + repelDx;
              const glyphY = lineY + repelDy;
              context.fillText(glyph, glyphX, glyphY);
              context.fillText(glyph, glyphX, glyphY + 3);
              context.fillText(glyph, glyphX, glyphY + 6);
            }
          }
          context.globalAlpha = 1;
        }
      }

      // Notation, scrolling leftward toward the clef decal. Visibility is
      // culled per element; alpha is applied per glyph inside the helpers.
      context.fillStyle = noteColor;
      for (const element of elements) {
        const screenX = element.x - scrollX;
        const edge = Math.max(
          elementAlphaAt(screenX),
          elementAlphaAt(screenX + element.width),
        );
        if (edge <= 0.02) {
          continue;
        }

        if (element.kind === "bar") {
          drawBar(element, screenX, t);
        } else if (element.kind === "eighthPair" || element.kind === "sixteenthRun") {
          drawBeamedGroup(element, screenX, t);
        } else {
          drawSingleNote(element, screenX, t);
        }
      }

      context.globalAlpha = 1;
    };

    const advance = (dt: number) => {
      const targetFactor = playingRef.current
        ? PLAYING_SPEED_FACTOR
        : IDLE_SPEED_FACTOR;
      speedFactor +=
        (targetFactor - speedFactor) * (1 - Math.exp(-dt / SPEED_EASE_SECONDS));
      simTime += dt;
      scrollX += scrollSpeed * speedFactor * dt;

      // The field trails a smoothed cursor and its strength eases in/out,
      // so the dispersal always reads fluid, never snappy.
      const pointerBlend = 1 - Math.exp(-dt / POINTER_EASE_SECONDS);
      pointerX += (pointerTargetX - pointerX) * pointerBlend;
      pointerY += (pointerTargetY - pointerY) * pointerBlend;
      const strengthTarget = pointerActive ? 1 : 0;
      repelStrength +=
        (strengthTarget - repelStrength) *
        (1 - Math.exp(-dt / REPEL_EASE_SECONDS));

      ensureElements();
    };

    const step = (timestamp: number) => {
      animationFrame = 0;

      if (disposed) {
        return;
      }

      const delta =
        previousTimestamp === 0
          ? 0
          : Math.min(timestamp - previousTimestamp, MAX_FRAME_DELTA_MS);
      previousTimestamp = timestamp;

      // The deck mounts only on the home view; track its edge cheaply.
      if (timestamp - lastDeckPollAt > 500) {
        lastDeckPollAt = timestamp;
        measureDeck();
      }

      advance(delta / 1000);
      draw(simTime);
      syncClefTilt(simTime);
      scheduleStep();
    };

    const scheduleStep = () => {
      if (!animationFrame && !disposed) {
        animationFrame = window.requestAnimationFrame(step);
      }
    };

    const stopLoop = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    };

    // Reduced motion shows one still of the score instead of an empty layer;
    // the clef is posed once to match the frozen wave.
    const drawStaticFrame = () => {
      ensureElements();
      draw(simTime);
      syncClefTilt(simTime);
    };

    const syncSize = () => {
      width = container.clientWidth;
      height = container.clientHeight;

      // The staff is sized to the treble-clef decal on the left (see
      // ClientLayout: width clamp(340px, 40vw, 640px), aspect 811/1368,
      // vertically centered). A real clef spans ~2.2x its staff, which puts
      // the line spacing at ~12.5% of the decal's width.
      const decalWidth = Math.min(Math.max(340, width * 0.4), 640);
      const previousSpacing = spacing;
      spacing = Math.min(decalWidth * 0.145, height / 8);
      halfStep = spacing / 2;
      stemLength = 3.1 * spacing;
      scrollSpeed = 0.45 * spacing;
      clefRight = decalWidth - 48; // decal is offset -48px (-left-12)

      // Large retina canvases are expensive to clear and upload at 60fps.
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const backingWidth = Math.max(1, Math.round(width * pixelRatio));
      const backingHeight = Math.max(1, Math.round(height * pixelRatio));
      stripHeight = Math.ceil(1.6 * spacing + 30);

      if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
        canvas.width = backingWidth;
        canvas.height = backingHeight;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }
      strip.width = backingWidth;
      strip.height = Math.max(1, Math.round(stripHeight * pixelRatio));
      staffBandHeight = 4 * spacing + stripHeight;
      staffCanvas.width = backingWidth;
      staffCanvas.height = Math.max(1, Math.round(staffBandHeight * pixelRatio));
      stripDrawnAt = -1;

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      stripContext?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      staffCanvasContext?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      if (spacing !== previousSpacing) {
        headFillPattern = buildEllipsePattern(false);
        headOpenPattern = buildEllipsePattern(true);
        dotPattern = buildDotPattern();
        headFillSprite = bakeSprite(headFillPattern, pixelRatio);
        headOpenSprite = bakeSprite(headOpenPattern, pixelRatio);
        dotSprite = bakeSprite(dotPattern, pixelRatio);
        rebuildElements();
      } else {
        ensureElements();
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      syncSize();
      measureDeck();

      if (reducedMotionQuery.matches) {
        drawStaticFrame();
      } else if (!document.hidden) {
        scheduleStep();
      }
    });
    resizeObserver.observe(container);

    const handlePointerMove = (event: PointerEvent) => {
      if (!finePointerQuery.matches) {
        return;
      }
      pointerTargetX = event.clientX;
      pointerTargetY = event.clientY;
      if (!pointerSeeded) {
        pointerSeeded = true;
        pointerX = pointerTargetX;
        pointerY = pointerTargetY;
      }
      pointerActive = true;
    };
    const handlePointerGone = () => {
      pointerActive = false;
    };
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    document.documentElement.addEventListener(
      "pointerleave",
      handlePointerGone,
    );
    window.addEventListener("blur", handlePointerGone);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopLoop();
        return;
      }

      if (!reducedMotionQuery.matches) {
        // Reset the clock so the first frame back doesn't jump the score.
        previousTimestamp = 0;
        scheduleStep();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleMotionPreferenceChange = () => {
      if (reducedMotionQuery.matches) {
        stopLoop();
        drawStaticFrame();
        return;
      }

      previousTimestamp = 0;
      if (!document.hidden) {
        scheduleStep();
      }
    };
    reducedMotionQuery.addEventListener(
      "change",
      handleMotionPreferenceChange,
    );

    return () => {
      disposed = true;
      stopLoop();
      resizeObserver.disconnect();
      if (clefElement) {
        clefElement.style.transform = "";
        clefElement.style.willChange = "";
      }
      window.removeEventListener("pointermove", handlePointerMove);
      document.documentElement.removeEventListener(
        "pointerleave",
        handlePointerGone,
      );
      window.removeEventListener("blur", handlePointerGone);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      reducedMotionQuery.removeEventListener(
        "change",
        handleMotionPreferenceChange,
      );
    };
  }, [noteColor, staffColor]);

  const handleRevealAnimationEnd = (
    event: ReactAnimationEvent<HTMLDivElement>,
  ) => {
    if (
      event.target === event.currentTarget &&
      event.animationName === "siteBackgroundReveal"
    ) {
      onRevealComplete?.();
    }
  };

  return (
    <div
      ref={containerRef}
      className={["site-score-layer overflow-hidden", className]
        .filter(Boolean)
        .join(" ")}
      data-reveal-state={revealState}
      onAnimationEnd={handleRevealAnimationEnd}
      style={{ contain: "strict" }}
      aria-hidden
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
});

export function AsciiMusicScoreLayer({
  className,
  revealState,
  onRevealComplete,
}: Pick<
  AsciiMusicScoreProps,
  "className" | "revealState" | "onRevealComplete"
>) {
  // The timeline context ticks a few times per second during playback; the
  // memoized child bails out of those renders unless isPlaying itself flips.
  const { isPlaying } = useMusicTimeline();

  return (
    <AsciiMusicScore
      className={className}
      revealState={revealState}
      playing={isPlaying}
      onRevealComplete={onRevealComplete}
    />
  );
}
