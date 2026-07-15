"use client";

import { useEffect, useRef } from "react";

const ASCII_CHARSETS = {
  standard: " .,:;i1tfLCG08@",
  blocks: " ░▒▓█",
  dense:
    " .'`^\",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
} as const;

type CharsetPreset = keyof typeof ASCII_CHARSETS;
type ObjectFit = "cover" | "contain" | "fill";

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

    image.onerror = () => reject(new Error(`Unable to load ${src}`));
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
    let rows: string[] | undefined;

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

      rows.forEach((row, index) => {
        if (row.trim().length > 0) {
          context.fillText(row, 0, index * characterHeight);
        }
      });

      context.restore();
    };

    const scheduleDraw = () => {
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    const resizeObserver = new ResizeObserver(scheduleDraw);
    resizeObserver.observe(container);

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
      });

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      window.cancelAnimationFrame(animationFrame);
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
  ]);

  return (
    <div
      ref={containerRef}
      className={["overflow-hidden", className].filter(Boolean).join(" ")}
      style={{ backgroundColor, contain: "strict" }}
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
