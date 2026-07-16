"use client";

import { useEffect, useRef } from "react";

const TAU = Math.PI * 2;

const PETAL_COUNT = 22;
const PETAL_FILL = "rgba(255, 255, 255, 0.92)";
const PETAL_STROKE = "rgba(68, 71, 77, 0.22)"; // hairline so white reads on white
const MAX_FRAME_DELTA_MS = 100;

// Fall angle: drift is a fraction of fallSpeed, so every petal travels a
// straight diagonal line (top-right toward bottom-left) before sway/flutter
// ripple on top of it. ~0.7 puts the path at roughly 35deg off vertical.
const DRIFT_RATIO_MIN = 0.62;
const DRIFT_RATIO_MAX = 0.85;
const SPAWN_PAD_X = 140; // lets petals enter from off the right edge

interface Petal {
  x: number;
  y: number;
  size: number;
  fallSpeed: number; // px/s, downward
  drift: number; // px/s, leftward — see DRIFT_RATIO_* above
  swayAmplitude: number;
  swayFrequency: number;
  swayPhase: number;
  rotation: number;
  rotationSpeed: number;
  flutterFrequency: number; // scale-x oscillation fakes the 3D tumble
  flutterPhase: number;
  alpha: number;
}

function createPetal(width: number, height: number, scattered: boolean): Petal {
  const depth = 0.4 + Math.random() * 0.6; // nearer petals: bigger, faster
  const fallSpeed = 26 + depth * 46;
  const driftRatio =
    DRIFT_RATIO_MIN + Math.random() * (DRIFT_RATIO_MAX - DRIFT_RATIO_MIN);
  return {
    x: scattered
      ? Math.random() * width
      : -SPAWN_PAD_X + Math.random() * (width + SPAWN_PAD_X * 2),
    y: scattered ? Math.random() * height : -30 - Math.random() * 60,
    size: 7 + depth * 9,
    fallSpeed,
    drift: -fallSpeed * driftRatio,
    swayAmplitude: 14 + Math.random() * 22,
    swayFrequency: 0.5 + Math.random() * 0.7,
    swayPhase: Math.random() * TAU,
    rotation: Math.random() * TAU,
    rotationSpeed: (Math.random() - 0.5) * 2.4,
    flutterFrequency: 0.8 + Math.random() * 1.1,
    flutterPhase: Math.random() * TAU,
    alpha: 0.55 + depth * 0.4,
  };
}

// A sakura petal: teardrop with the signature notched tip.
function tracePetal(context: CanvasRenderingContext2D, size: number) {
  context.beginPath();
  context.moveTo(0, size);
  context.bezierCurveTo(size * 0.9, size * 0.45, size * 0.75, -size * 0.4, size * 0.16, -size * 0.9);
  context.lineTo(0, -size * 0.62);
  context.lineTo(-size * 0.16, -size * 0.9);
  context.bezierCurveTo(-size * 0.75, -size * 0.4, -size * 0.9, size * 0.45, 0, size);
  context.closePath();
}

export function CherryBlossoms({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    let disposed = false;
    let animationFrame = 0;
    let previousTimestamp = 0;
    let simTime = 0;
    let width = 0;
    let height = 0;
    const petals: Petal[] = [];

    const syncSize = () => {
      width = container.clientWidth;
      height = container.clientHeight;

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const backingWidth = Math.max(1, Math.round(width * pixelRatio));
      const backingHeight = Math.max(1, Math.round(height * pixelRatio));

      if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
        canvas.width = backingWidth;
        canvas.height = backingHeight;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      // The observer's first fire can arrive before layout; only populate
      // once the container has real dimensions.
      if (width > 0 && height > 0) {
        while (petals.length < PETAL_COUNT) {
          petals.push(createPetal(width, height, true));
        }
      }
    };

    const draw = (t: number) => {
      context.clearRect(0, 0, width, height);

      context.fillStyle = PETAL_FILL;
      context.strokeStyle = PETAL_STROKE;
      context.lineWidth = 1;

      for (const petal of petals) {
        const sway =
          petal.swayAmplitude *
          Math.sin(t * petal.swayFrequency * TAU * 0.16 + petal.swayPhase);
        const flutter =
          0.35 +
          0.65 *
            Math.abs(Math.sin(t * petal.flutterFrequency + petal.flutterPhase));

        context.save();
        context.globalAlpha = petal.alpha;
        context.translate(petal.x + sway, petal.y);
        context.rotate(petal.rotation);
        context.scale(flutter, 1);
        tracePetal(context, petal.size);
        context.fill();
        context.stroke();
        context.restore();
      }
    };

    const advance = (dt: number) => {
      simTime += dt;
      for (let i = 0; i < petals.length; i += 1) {
        const petal = petals[i];
        petal.y += petal.fallSpeed * dt;
        petal.x += petal.drift * dt;
        petal.rotation += petal.rotationSpeed * dt;

        if (
          petal.y > height + 40 ||
          petal.x < -60 - petal.swayAmplitude
        ) {
          petals[i] = createPetal(width, height, false);
        }
      }
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

      advance(delta / 1000);
      draw(simTime);
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

    const resizeObserver = new ResizeObserver(() => {
      syncSize();

      if (reducedMotionQuery.matches) {
        draw(0); // a still scattering instead of animation
      } else if (!document.hidden) {
        scheduleStep();
      }
    });
    resizeObserver.observe(container);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopLoop();
        return;
      }
      if (!reducedMotionQuery.matches) {
        previousTimestamp = 0;
        scheduleStep();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleMotionPreferenceChange = () => {
      if (reducedMotionQuery.matches) {
        stopLoop();
        draw(0);
        return;
      }
      previousTimestamp = 0;
      if (!document.hidden) {
        scheduleStep();
      }
    };
    reducedMotionQuery.addEventListener("change", handleMotionPreferenceChange);

    return () => {
      disposed = true;
      stopLoop();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      reducedMotionQuery.removeEventListener(
        "change",
        handleMotionPreferenceChange,
      );
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={[
        "pointer-events-none absolute inset-0 z-10 select-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
