// ConfettiFall.tsx
import React, { useEffect, useMemo, useRef } from "react";

type Vec2 = { x: number; y: number };

type ConfettiFallProps = {
  /** Toggle to fire the animation. If you want to re-fire while true, change `runKey`. */
  active: boolean;

  /** Array of HEX colors, e.g. ["#FFD54A", "#111111", "#FF7A00"] */
  colors: string[];

  /** Optional: change this value to force a new run even if `active` stays true */
  runKey?: string | number;

  /** How many pieces total */
  particleCount?: number;

  /** How long to emit new pieces (ms). After this, only simulation continues until pieces exit. */
  emitDurationMs?: number;

  /** Max lifetime per particle (ms). Particles may end earlier if they leave bounds. */
  particleTtlMs?: [number, number];

  /** Normalized origin (0..1). Default is top-center like the video */
  origin?: { x: number; y: number };

  /** Spread angle in degrees around straight-down (90°). Ex: 32 means 90±16 */
  spreadDeg?: number;

  /** Initial speed range in px/s */
  startSpeed?: [number, number];

  /** Gravity in px/s^2 */
  gravity?: number;

  /** Air drag 0..1 (higher = slows faster). Recommended 0.01–0.05 */
  drag?: number;

  /** Horizontal wind acceleration px/s^2 (can be 0) */
  wind?: number;

  /** Wobble strength (px) */
  wobble?: [number, number];

  /** Piece size range (px) */
  size?: [number, number];

  /** Canvas style control */
  className?: string;
  style?: React.CSSProperties;
  zIndex?: number;

  /** Called when the run fully finishes */
  onComplete?: () => void;
};

type Particle = {
  id: number;
  pos: Vec2;
  vel: Vec2;
  w: number;
  h: number;
  color: string;
  rot: number;
  rotSpeed: number;
  shape: "rect" | "tri";
  bornAt: number;
  ttl: number;
  wobblePhase: number;
  wobbleFreq: number;
  wobbleAmp: number;
  alpha: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function degToRad(d: number) {
  return (d * Math.PI) / 180;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

export function ConfettiFall({
  active,
  colors,
  runKey,
  particleCount = 120,
  emitDurationMs = 650,
  particleTtlMs = [1800, 3200],
  origin = { x: 0.5, y: -0.05 }, // slightly above top edge, like the video
  spreadDeg = 34,
  startSpeed = [140, 280],
  gravity = 780,
  drag = 0.02,
  wind = 0,
  wobble = [6, 22],
  size = [5, 11],
  className,
  style,
  zIndex = 50,
  onComplete,
}: ConfettiFallProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const runningRef = useRef(false);
  const emitEndAtRef = useRef<number>(0);
  const lastTRef = useRef<number>(0);
  const runIdRef = useRef<number>(0);
  const idCounterRef = useRef<number>(1);

  const safeColors = useMemo(() => {
    const cleaned = (colors ?? []).filter(Boolean);
    return cleaned.length ? cleaned : ["#FFD54A", "#111111", "#FF7A00", "#FFFFFF"];
  }, [colors]);

  // Resize canvas to match its displayed size (HiDPI-safe)
  const resize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));

    // Only update if changed to avoid extra clears
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels
    }
  };

  const spawnParticle = (now: number, width: number, height: number): Particle => {
    const angCenter = 90; // straight down
    const half = spreadDeg / 2;
    const ang = degToRad(rand(angCenter - half, angCenter + half));
    const spd = rand(startSpeed[0], startSpeed[1]);

    const w = rand(size[0], size[1]);
    const h = rand(size[0], size[1]) * rand(0.6, 1.8);

    const x = origin.x * width + rand(-width * 0.06, width * 0.06);
    const y = origin.y * height;

    const color = safeColors[Math.floor(Math.random() * safeColors.length)];
    const shape: Particle["shape"] = Math.random() < 0.72 ? "rect" : "tri";

    const ttl = rand(particleTtlMs[0], particleTtlMs[1]);

    return {
      id: idCounterRef.current++,
      pos: { x, y },
      vel: { x: Math.cos(ang) * spd, y: Math.sin(ang) * spd },
      w,
      h,
      color,
      rot: rand(0, Math.PI * 2),
      rotSpeed: rand(-7.0, 7.0),
      shape,
      bornAt: now,
      ttl,
      wobblePhase: rand(0, Math.PI * 2),
      wobbleFreq: rand(2.2, 5.2),
      wobbleAmp: rand(wobble[0], wobble[1]),
      alpha: 1,
    };
  };

  const drawParticle = (ctx: CanvasRenderingContext2D, p: Particle) => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.translate(p.pos.x, p.pos.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;

    if (p.shape === "rect") {
      // Slightly rounded rectangles look like modern UI confetti
      const r = Math.min(2, Math.min(p.w, p.h) / 3);
      const x = -p.w / 2;
      const y = -p.h / 2;
      const w = p.w;
      const h = p.h;

      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fill();
    } else {
      // Triangle
      ctx.beginPath();
      ctx.moveTo(0, -p.h / 2);
      ctx.lineTo(p.w / 2, p.h / 2);
      ctx.lineTo(-p.w / 2, p.h / 2);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  };

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    runningRef.current = false;
    lastTRef.current = 0;
  };

  const tick = (t: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // dt in seconds, clamped to avoid huge jumps (tab switching)
    const last = lastTRef.current || t;
    const dt = clamp((t - last) / 1000, 0, 0.033);
    lastTRef.current = t;

    // Emit phase (like the short burst in the video)
    if (t < emitEndAtRef.current) {
      const remaining = Math.max(0, emitEndAtRef.current - t);
      const emitWindow = emitDurationMs;
      const progress = 1 - remaining / emitWindow;

      // Smoothly emit more early, taper off
      const eased = 1 - Math.pow(1 - progress, 2);

      // Determine how many should exist by now
      const targetCount = Math.floor(particleCount * eased);
      const need = targetCount - particlesRef.current.length;
      for (let i = 0; i < need; i++) {
        particlesRef.current.push(spawnParticle(t, width, height));
      }
    }

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Update & draw
    const next: Particle[] = [];
    for (const p of particlesRef.current) {
      const age = t - p.bornAt;

      // Physics
      // gravity
      p.vel.y += gravity * dt;

      // wind (with a tiny time-varying component)
      const windGust = wind + Math.sin((t / 1000) * 0.9 + p.wobblePhase) * (wind * 0.35);
      p.vel.x += windGust * dt;

      // drag
      const dragFactor = Math.max(0, 1 - drag);
      p.vel.x *= Math.pow(dragFactor, dt * 60);
      p.vel.y *= Math.pow(dragFactor, dt * 60);

      // wobble (natural flutter)
      const wobbleX = Math.sin((t / 1000) * p.wobbleFreq + p.wobblePhase) * p.wobbleAmp;

      p.pos.x += (p.vel.x * dt) + wobbleX * dt * 12;
      p.pos.y += p.vel.y * dt;

      // tumble
      p.rot += p.rotSpeed * dt;

      // fade near end of TTL
      const ttl = p.ttl;
      const fadeStart = ttl * 0.72;
      if (age > fadeStart) {
        const k = clamp((ttl - age) / (ttl - fadeStart), 0, 1);
        p.alpha = k;
      } else {
        p.alpha = 1;
      }

      const out =
        age > ttl ||
        p.pos.y > height + 80 ||
        p.pos.x < -80 ||
        p.pos.x > width + 80;

      if (!out) {
        drawParticle(ctx, p);
        next.push(p);
      }
    }
    particlesRef.current = next;

    // End condition: emission finished + no particles left
    if (t >= emitEndAtRef.current && particlesRef.current.length === 0) {
      stop();
      onComplete?.();
      return;
    }

    rafRef.current = requestAnimationFrame(tick);
  };

  const start = () => {
    if (prefersReducedMotion()) return;

    resize();
    runIdRef.current += 1;
    particlesRef.current = [];
    emitEndAtRef.current = performance.now() + emitDurationMs;

    if (!runningRef.current) {
      runningRef.current = true;
      rafRef.current = requestAnimationFrame(tick);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    // Initial size
    resize();

    return () => {
      window.removeEventListener("resize", onResize);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!active) {
      // If you want it to instantly stop/clear when inactive:
      // particlesRef.current = [];
      // stop();
      return;
    }
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, runKey]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex,
        ...style,
      }}
    />
  );
}
