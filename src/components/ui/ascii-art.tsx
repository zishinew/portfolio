"use client";

import {
  useEffect,
  useRef,
  type AnimationEvent as ReactAnimationEvent,
} from "react";

const ASCII_CHARSETS = {
  standard: " .,:;i1tfLCG08@",
  blocks: " ░▒▓█",
  dense:
    " .'`^\",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
} as const;

type CharsetPreset = keyof typeof ASCII_CHARSETS;
type ObjectFit = "cover" | "contain" | "fill";

// Cursor repulsion: glyphs near a fine pointer are pushed radially away with
// a squared falloff and ease back once the cursor moves on, mirroring the
// music score's dispersal. The rAF loop only runs while the effect is live.
const REPEL_RADIUS_PX = 130;
const REPEL_STRENGTH_PX = 34;
const POINTER_EASE_SECONDS = 0.06;
const REPEL_EASE_SECONDS = 0.16;

interface AsciiArtStaticProps {
  src: string;
  resolution?: number;
  charset?: CharsetPreset | string;
  color?: string;
  backgroundColor?: string;
  inverted?: boolean;
  fontFamily?: string;
  className?: string;
  objectFit?: ObjectFit;
  revealState?: "hidden" | "entering" | "visible";
  onReady?: () => void;
  onRevealComplete?: () => void;
}

const rowCache = new Map<string, Promise<string[]>>();

function resolveCharset(charset: CharsetPreset | string) {
  return charset in ASCII_CHARSETS
    ? ASCII_CHARSETS[charset as CharsetPreset]
    : charset;
}

function createAsciiRows({
  src,
  resolution,
  charset,
  inverted,
  objectFit,
}: {
  src: string;
  resolution: number;
  charset: string;
  inverted: boolean;
  objectFit: ObjectFit;
}) {
  const cacheKey = [src, resolution, charset, inverted, objectFit].join("|");
  const cached = rowCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const rowsPromise = new Promise<string[]>((resolve, reject) => {
    const image = new window.Image();
    image.decoding = "async";
    image.fetchPriority = "high";

    image.onload = () => {
      const sampleCanvas = document.createElement("canvas");
      const context = sampleCanvas.getContext("2d", {
        willReadFrequently: true,
      });

      if (!context) {
        reject(new Error("Canvas context is unavailable"));
        return;
      }

      const imageAspect = image.naturalWidth / image.naturalHeight;
      const visualAspect = objectFit === "fill" ? imageAspect : 1;
      const columns = resolution;
      const rowCount = Math.max(
        1,
        Math.floor((columns * 0.55) / visualAspect),
      );

      sampleCanvas.width = columns;
      sampleCanvas.height = rowCount;

      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = image.naturalWidth;
      let sourceHeight = image.naturalHeight;

      if (objectFit === "cover") {
        if (imageAspect > visualAspect) {
          sourceWidth = image.naturalHeight * visualAspect;
          sourceX = (image.naturalWidth - sourceWidth) / 2;
        } else {
          sourceHeight = image.naturalWidth / visualAspect;
          sourceY = (image.naturalHeight - sourceHeight) / 2;
        }
      }

      if (objectFit === "contain") {
        let drawWidth: number;
        let drawHeight: number;

        if (imageAspect > visualAspect) {
          drawWidth = columns;
          drawHeight = (columns / imageAspect) * 0.55;
        } else {
          drawHeight = rowCount;
          drawWidth = (rowCount * imageAspect) / 0.55;
        }

        context.drawImage(
          image,
          (columns - drawWidth) / 2,
          (rowCount - drawHeight) / 2,
          drawWidth,
          drawHeight,
        );
      } else {
        context.drawImage(
          image,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          columns,
          rowCount,
        );
      }

      const pixels = context.getImageData(0, 0, columns, rowCount).data;
      const effectiveCharset = inverted
        ? [...charset].reverse().join("")
        : charset;
      const rows: string[] = [];

      for (let y = 0; y < rowCount; y += 1) {
        let row = "";

        for (let x = 0; x < columns; x += 1) {
          const index = (y * columns + x) * 4;
          const brightness =
            (0.299 * pixels[index] +
              0.587 * pixels[index + 1] +
              0.114 * pixels[index + 2]) /
            255;
          const alpha = pixels[index + 3] / 255;
          const compositedBrightness = alpha * brightness + (1 - alpha);
          const characterIndex = Math.floor(
            compositedBrightness * (effectiveCharset.length - 1),
          );

          row += effectiveCharset[characterIndex] ?? " ";
        }

        rows.push(row);
      }

      resolve(rows);
    };

    image.onerror = () => {
      rowCache.delete(cacheKey);
      reject(new Error(`Unable to load ${src}`));
    };
    image.src = src;
  });

  rowCache.set(cacheKey, rowsPromise);
  return rowsPromise;
}

export function AsciiArtStatic({
  src,
  resolution = 80,
  charset = "standard",
  color = "#000000",
  backgroundColor = "transparent",
  inverted = false,
  fontFamily = "monospace",
  className,
  objectFit = "cover",
  revealState = "visible",
  onReady,
  onRevealComplete,
}: AsciiArtStaticProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;

    if (!container || !canvas) {
      return;
    }

    let animationFrame = 0;
    let disposed = false;
    let hasReportedReady = false;
    let rows: string[] | undefined;

    const finePointerQuery = window.matchMedia("(pointer: fine)");
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    let effectFrame = 0;
    let effectTimestamp = 0;
    let pointerTargetX = 0;
    let pointerTargetY = 0;
    let pointerClientX = 0;
    let pointerClientY = 0;
    let pointerSeeded = false;
    let pointerActive = false;
    let repelStrength = 0;

    const reportReady = () => {
      if (disposed || hasReportedReady) {
        return;
      }

      hasReportedReady = true;
      onReady?.();
    };

    const draw = () => {
      animationFrame = 0;

      if (!rows || rows.length === 0) {
        return;
      }

      const width = container.clientWidth;
      const height = container.clientHeight;

      if (width === 0 || height === 0) {
        return;
      }

      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      // Large retina canvases consume tens of MiB and are expensive to upload.
      // ASCII texture does not gain visible detail above this density.
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const backingWidth = Math.max(1, Math.round(width * pixelRatio));
      const backingHeight = Math.max(1, Math.round(height * pixelRatio));

      if (
        canvas.width !== backingWidth ||
        canvas.height !== backingHeight
      ) {
        canvas.width = backingWidth;
        canvas.height = backingHeight;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);

      if (backgroundColor !== "transparent") {
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, width, height);
      }

      const columns = rows[0]?.length ?? 0;
      if (columns === 0) {
        return;
      }

      const characterWidth = width / columns;
      const characterHeight = height / rows.length;
      const fontSize = Math.min(characterWidth * 1.8, characterHeight * 1.2);

      context.fillStyle = color;
      context.font = `${fontSize}px ${fontFamily}`;
      context.textAlign = "left";
      context.textBaseline = "top";

      // Monochrome static art can be painted a row at a time. This replaces
      // roughly 16,000 fillText calls with about 120 calls at this resolution.
      const glyphWidth = context.measureText("M").width || characterWidth;
      const horizontalScale = characterWidth / glyphWidth;
      context.save();
      context.scale(horizontalScale, 1);

      // While the cursor is near, rows crossing its radius are split and the
      // characters inside it drawn one by one, pushed radially away. All
      // other rows keep the fast batched path.
      const rect = canvas.getBoundingClientRect();
      const localX = pointerClientX - rect.left;
      const localY = pointerClientY - rect.top;
      const fieldLive =
        repelStrength > 0.01 &&
        localX > -REPEL_RADIUS_PX &&
        localX < width + REPEL_RADIUS_PX &&
        localY > -REPEL_RADIUS_PX &&
        localY < height + REPEL_RADIUS_PX;
      const minRow = Math.max(
        0,
        Math.floor((localY - REPEL_RADIUS_PX) / characterHeight),
      );
      const maxRow = Math.min(
        rows.length - 1,
        Math.ceil((localY + REPEL_RADIUS_PX) / characterHeight),
      );
      const minColumn = Math.max(
        0,
        Math.floor((localX - REPEL_RADIUS_PX) / characterWidth),
      );
      const maxColumn = Math.min(
        columns - 1,
        Math.ceil((localX + REPEL_RADIUS_PX) / characterWidth),
      );

      rows.forEach((row, index) => {
        if (row.trim().length === 0) {
          return;
        }

        if (!fieldLive || index < minRow || index > maxRow) {
          context.fillText(row, 0, index * characterHeight);
          return;
        }

        const y = index * characterHeight;
        const leftSlice = row.slice(0, minColumn);
        const rightSlice = row.slice(maxColumn + 1);
        if (leftSlice.trim().length > 0) {
          context.fillText(leftSlice, 0, y);
        }
        if (rightSlice.trim().length > 0) {
          context.fillText(rightSlice, (maxColumn + 1) * glyphWidth, y);
        }

        const cellCenterY = y + characterHeight / 2;
        for (let column = minColumn; column <= maxColumn; column += 1) {
          const glyph = row[column];
          if (glyph === " " || glyph === undefined) {
            continue;
          }

          const relX = (column + 0.5) * characterWidth - localX;
          const relY = cellCenterY - localY;
          const distanceSq = relX * relX + relY * relY;
          let dx = 0;
          let dy = 0;
          if (distanceSq < REPEL_RADIUS_PX * REPEL_RADIUS_PX && distanceSq > 0) {
            const distance = Math.sqrt(distanceSq);
            const falloff = 1 - distance / REPEL_RADIUS_PX;
            const push =
              repelStrength * REPEL_STRENGTH_PX * falloff * falloff;
            dx = (relX / distance) * push;
            dy = (relY / distance) * push;
          }

          context.fillText(
            glyph,
            column * glyphWidth + dx / horizontalScale,
            y + dy,
          );
        }
      });

      context.restore();
      reportReady();
    };

    const scheduleDraw = () => {
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    // The dispersal loop runs only while the cursor is near the decal (or
    // the field is still easing out); it then settles on a static frame.
    const effectStep = (timestamp: number) => {
      effectFrame = 0;

      if (disposed) {
        return;
      }

      const delta =
        effectTimestamp === 0
          ? 16.7
          : Math.min(timestamp - effectTimestamp, 100);
      effectTimestamp = timestamp;
      const dt = delta / 1000;

      const pointerBlend = 1 - Math.exp(-dt / POINTER_EASE_SECONDS);
      pointerClientX += (pointerTargetX - pointerClientX) * pointerBlend;
      pointerClientY += (pointerTargetY - pointerClientY) * pointerBlend;

      const rect = canvas.getBoundingClientRect();
      const near =
        pointerActive &&
        pointerTargetX > rect.left - REPEL_RADIUS_PX &&
        pointerTargetX < rect.right + REPEL_RADIUS_PX &&
        pointerTargetY > rect.top - REPEL_RADIUS_PX &&
        pointerTargetY < rect.bottom + REPEL_RADIUS_PX;
      repelStrength +=
        ((near ? 1 : 0) - repelStrength) *
        (1 - Math.exp(-dt / REPEL_EASE_SECONDS));

      draw();

      if (repelStrength > 0.01 || near) {
        effectFrame = window.requestAnimationFrame(effectStep);
      } else {
        effectTimestamp = 0;
        scheduleDraw();
      }
    };

    const wakeEffect = () => {
      if (!effectFrame && !document.hidden) {
        effectTimestamp = 0;
        effectFrame = window.requestAnimationFrame(effectStep);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!finePointerQuery.matches || reducedMotionQuery.matches) {
        return;
      }
      pointerTargetX = event.clientX;
      pointerTargetY = event.clientY;
      if (!pointerSeeded) {
        pointerSeeded = true;
        pointerClientX = pointerTargetX;
        pointerClientY = pointerTargetY;
      }
      pointerActive = true;
      wakeEffect();
    };
    const handlePointerGone = () => {
      pointerActive = false;
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(effectFrame);
        effectFrame = 0;
        effectTimestamp = 0;
      }
    };
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    document.documentElement.addEventListener(
      "pointerleave",
      handlePointerGone,
    );
    window.addEventListener("blur", handlePointerGone);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const resizeObserver = new ResizeObserver(scheduleDraw);
    resizeObserver.observe(container);

    const loadRows = () => {
      void createAsciiRows({
        src,
        resolution,
        charset: resolveCharset(charset),
        inverted,
        objectFit,
      })
        .then((nextRows) => {
          if (disposed) {
            return;
          }

          rows = nextRows;
          scheduleDraw();
        })
        .catch(() => {
          // The artwork is decorative; a failed texture should not block the UI.
          reportReady();
        });
    };

    // This mounts behind the sound prompt, so prepare it before any visible
    // homepage animation rather than racing the foreground during reveal.
    loadRows();

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      window.cancelAnimationFrame(animationFrame);
      window.cancelAnimationFrame(effectFrame);
      window.removeEventListener("pointermove", handlePointerMove);
      document.documentElement.removeEventListener(
        "pointerleave",
        handlePointerGone,
      );
      window.removeEventListener("blur", handlePointerGone);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    backgroundColor,
    charset,
    color,
    fontFamily,
    inverted,
    objectFit,
    resolution,
    src,
    onReady,
  ]);

  const handleRevealAnimationEnd = (
    event: ReactAnimationEvent<HTMLDivElement>,
  ) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.animationName === "siteBackgroundReveal") {
      onRevealComplete?.();
    }
  };

  return (
    <div
      ref={containerRef}
      className={["site-ascii-layer overflow-hidden", className]
        .filter(Boolean)
        .join(" ")}
      data-reveal-state={revealState}
      onAnimationEnd={handleRevealAnimationEnd}
      style={{ backgroundColor, contain: "strict" }}
      aria-hidden
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        aria-label="ASCII art rendering of image"
        role="img"
      />
    </div>
  );
}
