import { useEffect, useRef } from 'react';
import { EmberField, emberColor } from '../lib/emberField';
import type { EmberEmitter } from '../lib/emberField';
import type { FireLook } from '../lib/fireIntensity';
import { FireRenderer, NORMAL_PALETTE } from '../lib/fireShader';
import type { FirePalette } from '../lib/fireShader';

type FireCanvasProps = {
  /** Called every frame with seconds since mount; returns how alive the fire is. */
  getLook: (elapsedSeconds: number) => FireLook;
  palette?: FirePalette;
  /** Flame height as a fraction of the canvas height. */
  height: number;
  /** Baseline as a fraction of the canvas height (negative hides the bed below the edge). */
  base?: number;
  /** Half width of the fuel bed as a fraction of the canvas width. */
  bedHalf: number;
  /** Fraction of CSS pixels rendered (lower = cheaper). */
  resolution?: number;
  /** Frame-rate cap. */
  fps?: number;
  /** Render a single still frame (reduced motion). */
  still?: boolean;
  /** Pause when the canvas is off-screen or the page is hidden. */
  pauseWhenHidden?: boolean;
  /** Increments to trigger a flare + burst of embers (e.g. poking the fire). */
  pokeKey?: number;
  /** Maximum simultaneous embers. */
  maxEmbers?: number;
  className?: string;
  /** Fired once if the GPU can't run the shader, so the caller can show a CSS fallback. */
  onUnsupported?: () => void;
  /** Fired once the first frame is on screen. */
  onReady?: () => void;
};

const SPRITE_STEPS = 10;

const makeEmberSprites = () => {
  const sprites: HTMLCanvasElement[] = [];
  for (let i = 0; i < SPRITE_STEPS; i += 1) {
    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    const [r, g, b] = emberColor(i / (SPRITE_STEPS - 1));
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, `rgba(${r},${g},${b},1)`);
    gradient.addColorStop(0.18, `rgba(${r},${g},${b},0.92)`);
    gradient.addColorStop(0.5, `rgba(${r},${g},${b},0.22)`);
    gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    sprites.push(canvas);
  }
  return sprites;
};

/**
 * A GPU flame with physically-moving embers on top.
 * Always decorative: aria-hidden, pointer-events none.
 */
export function FireCanvas({
  getLook,
  palette = NORMAL_PALETTE,
  height,
  base = -0.04,
  bedHalf,
  resolution = 0.7,
  fps = 60,
  still = false,
  pauseWhenHidden = true,
  pokeKey = 0,
  maxEmbers = 120,
  className,
  onUnsupported,
  onReady,
}: FireCanvasProps) {
  const flameRef = useRef<HTMLCanvasElement>(null);
  const emberRef = useRef<HTMLCanvasElement>(null);
  const pokeRef = useRef({ key: pokeKey, flare: 0, pending: 0 });

  // Latest props live in a ref so the render loop never needs to restart.
  const live = useRef({ getLook, palette, height, base, bedHalf, resolution, fps, still, onUnsupported, onReady });
  live.current = { getLook, palette, height, base, bedHalf, resolution, fps, still, onUnsupported, onReady };

  useEffect(() => {
    if (pokeKey !== pokeRef.current.key) {
      pokeRef.current.key = pokeKey;
      pokeRef.current.flare = 1;
      pokeRef.current.pending += 26;
    }
  }, [pokeKey]);

  useEffect(() => {
    const flameCanvas = flameRef.current;
    const emberCanvas = emberRef.current;
    if (!flameCanvas || !emberCanvas) return undefined;

    const renderer = FireRenderer.create(flameCanvas);
    if (!renderer) {
      live.current.onUnsupported?.();
      return undefined;
    }

    const emberCtx = emberCanvas.getContext('2d');
    const sprites = makeEmberSprites();
    const embers = new EmberField(maxEmbers, (Date.now() & 0xffff) + 1);

    let frame = 0;
    let running = true;
    let visible = true;
    let readyFired = false;
    let startMs = 0;
    let lastMs = 0;
    let cssWidth = 0;
    let cssHeight = 0;
    // Adaptive quality: if frames take too long, render fewer pixels (the flame is
    // soft by nature, so a lower resolution barely shows).
    let quality = 1;
    let frameEma = 16;
    let slowFrames = 0;

    const resize = () => {
      const rect = flameCanvas.getBoundingClientRect();
      cssWidth = Math.max(1, rect.width);
      cssHeight = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const scale = live.current.resolution * dpr * quality;
      renderer.resize(Math.max(2, Math.round(cssWidth * scale)), Math.max(2, Math.round(cssHeight * scale)));
      // Embers are drawn at full device resolution so sparks stay crisp.
      emberCanvas.width = Math.round(cssWidth * dpr);
      emberCanvas.height = Math.round(cssHeight * dpr);
    };

    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    observer?.observe(flameCanvas);
    resize();

    const intersection = pauseWhenHidden && typeof IntersectionObserver === 'function'
      ? new IntersectionObserver((entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        if (visible && running && !frame) frame = requestAnimationFrame(tick);
      })
      : null;
    intersection?.observe(flameCanvas);

    const draw = (nowMs: number) => {
      const cfg = live.current;
      const elapsed = (nowMs - startMs) / 1000;
      const dt = lastMs ? (nowMs - lastMs) / 1000 : 0;
      lastMs = nowMs;

      if (dt > 0 && dt < 0.25 && !cfg.still) {
        frameEma = frameEma * 0.9 + dt * 1000 * 0.1;
        const budget = 1000 / Math.max(10, cfg.fps);
        slowFrames = frameEma > budget * 1.6 ? slowFrames + 1 : 0;
        if (slowFrames > 24 && quality > 0.45) {
          quality = Math.max(0.45, quality * 0.8);
          slowFrames = 0;
          frameEma = budget;
          resize();
        }
      }

      // Decay the poke flare toward zero.
      const poke = pokeRef.current;
      poke.flare = Math.max(0, poke.flare - dt * 1.6);

      const base = cfg.getLook(elapsed);
      // Poking the fire makes it surge, then settle.
      const look: FireLook = {
        ...base,
        intensity: base.intensity + poke.flare * 0.35,
        emberRate: base.emberRate + poke.flare * 40,
      };
      const flickerTime = cfg.still ? 4.2 : elapsed + 3;
      renderer.draw({
        time: flickerTime,
        intensity: look.intensity,
        flash: Math.max(look.flash, poke.flare * 0.55),
        smoke: look.smoke,
        height: cfg.height,
        base: cfg.base,
        bedHalf: cfg.bedHalf,
      }, cfg.palette);

      if (emberCtx && !cfg.still) {
        const dpr = emberCanvas.width / cssWidth;
        const emitter: EmberEmitter = {
          rate: look.emberRate,
          originX: emberCanvas.width / 2,
          spread: emberCanvas.width * Math.min(0.5, cfg.bedHalf) * 0.8,
          originY: emberCanvas.height * (1 - Math.max(0, cfg.base)) - emberCanvas.height * cfg.height * 0.12,
          energy: look.intensity,
          scale: dpr,
        };
        if (poke.pending > 0) {
          embers.burst(poke.pending, emitter);
          poke.pending = 0;
        }
        embers.update(dt, emitter);

        emberCtx.clearRect(0, 0, emberCanvas.width, emberCanvas.height);
        emberCtx.globalCompositeOperation = 'lighter';
        for (const p of embers.embers) {
          const heat = 1 - p.age / p.life;
          const twinkle = 0.75 + 0.25 * Math.sin(p.age * 38 + p.phase * 5);
          const sprite = sprites[Math.min(SPRITE_STEPS - 1, Math.max(0, Math.round(heat * (SPRITE_STEPS - 1))))];
          if (!sprite) continue;
          const size = p.size * (2.4 + 1.8 * heat);
          emberCtx.globalAlpha = Math.min(1, heat ** 0.7 * 1.15) * twinkle;
          emberCtx.drawImage(sprite, p.x - size / 2, p.y - size / 2, size, size);
        }
        emberCtx.globalAlpha = 1;
        emberCtx.globalCompositeOperation = 'source-over';
      }

      if (!readyFired) {
        readyFired = true;
        cfg.onReady?.();
      }
    };

    const tick = (nowMs: number) => {
      frame = 0;
      if (!running) return;
      if (renderer.isLost) {
        live.current.onUnsupported?.();
        return;
      }
      if (!startMs) startMs = nowMs;

      const hidden = pauseWhenHidden && (!visible || document.visibilityState === 'hidden');
      const minGap = 1000 / Math.max(10, live.current.fps);
      if (!hidden && nowMs - lastMs >= minGap - 2) draw(nowMs);
      else if (hidden) lastMs = 0;

      // Off-screen: stop entirely (the IntersectionObserver restarts us).
      // Background tab: rAF itself is suspended by the browser.
      if (!live.current.still && !hidden) frame = requestAnimationFrame(tick);
    };

    if (live.current.still) {
      // One still frame, drawn after layout.
      frame = requestAnimationFrame((now) => {
        frame = 0;
        startMs = now;
        draw(now);
      });
    } else {
      frame = requestAnimationFrame(tick);
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') lastMs = 0;
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      if (frame) cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', onVisibility);
      observer?.disconnect();
      intersection?.disconnect();
      renderer.dispose();
    };
  }, [maxEmbers, pauseWhenHidden]);

  return (
    <div className={['fire-canvas', className].filter(Boolean).join(' ')} aria-hidden="true">
      <canvas ref={flameRef} className="fire-canvas-flame" />
      <canvas ref={emberRef} className="fire-canvas-embers" />
    </div>
  );
}
