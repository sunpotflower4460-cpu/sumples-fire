import { mulberry32 } from './fireSynth';

export type Ember = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  phase: number;
};

export type EmberEmitter = {
  /** Embers per second. */
  rate: number;
  /** Left edge of the bed in px. */
  originX: number;
  /** Half width of the bed in px. */
  spread: number;
  /** Baseline y in px (canvas coordinates, y grows downward). */
  originY: number;
  /** Overall energy of the fire (0..~1.3). */
  energy: number;
  /** Device-pixel scale for sizes and speeds. */
  scale: number;
};

/**
 * Rising sparks with simple buoyancy, curl-ish turbulence and cooling.
 * Pure state + update so it can be tested without a canvas.
 */
export class EmberField {
  readonly embers: Ember[] = [];
  private carry = 0;
  private readonly rng: () => number;

  constructor(private readonly max = 140, seed = 1) {
    this.rng = mulberry32(seed);
  }

  private spawn(e: EmberEmitter, burst = false) {
    if (this.embers.length >= this.max) return;
    const r = this.rng;
    const speed = (burst ? 1.9 : 1) * (70 + r() * 150) * (0.55 + 0.6 * e.energy) * e.scale;
    const angle = (r() - 0.5) * (burst ? 1.7 : 0.7);
    this.embers.push({
      x: e.originX + (r() * 2 - 1) * e.spread,
      y: e.originY - r() * 6 * e.scale,
      vx: Math.sin(angle) * speed * 0.55,
      vy: -Math.cos(angle) * speed,
      age: 0,
      life: 0.9 + r() * 1.9 + (burst ? 0.4 : 0),
      size: (1 + r() * 2.1) * e.scale,
      phase: r() * Math.PI * 2,
    });
  }

  burst(count: number, emitter: EmberEmitter) {
    for (let i = 0; i < count; i += 1) this.spawn(emitter, true);
  }

  update(dt: number, emitter: EmberEmitter) {
    const step = Math.min(0.05, Math.max(0, dt));

    this.carry += emitter.rate * step;
    while (this.carry >= 1) {
      this.carry -= 1;
      this.spawn(emitter);
    }

    for (let i = this.embers.length - 1; i >= 0; i -= 1) {
      const p = this.embers[i];
      p.age += step;
      if (p.age >= p.life) {
        this.embers.splice(i, 1);
        continue;
      }
      const heat = 1 - p.age / p.life;
      // Hot air lifts them; as they cool they drift and sway more.
      p.vy -= 55 * heat * step * emitter.scale;
      p.vx += Math.sin(p.age * 3.1 + p.phase) * 70 * (1.1 - heat) * step * emitter.scale;
      p.vx *= 1 - 0.55 * step;
      p.vy *= 1 - 0.28 * step;
      p.x += p.vx * step;
      p.y += p.vy * step;
    }
  }
}

/** Colour of an ember as it cools: warm yellow → orange → red → dull. Never white. */
export const emberColor = (heat: number): [number, number, number] => {
  const h = Math.min(1, Math.max(0, heat));
  if (h > 0.66) {
    const k = (h - 0.66) / 0.34;
    return [255, Math.round(178 + 52 * k), Math.round(70 + 60 * k)];
  }
  if (h > 0.33) {
    const k = (h - 0.33) / 0.33;
    return [255, Math.round(96 + 82 * k), Math.round(30 + 40 * k)];
  }
  const k = h / 0.33;
  return [Math.round(150 + 105 * k), Math.round(30 + 66 * k), Math.round(14 + 16 * k)];
};
