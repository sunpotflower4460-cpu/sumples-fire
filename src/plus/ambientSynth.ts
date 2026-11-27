/**
 * Procedural ambient layers for the Plus scenes.
 *
 * Everything is synthesised (no audio files, no downloads, no SDK), and every
 * layer is built to loop without a click:
 *   • beds are rendered a little longer and the tail is cross-faded into the head
 *   • one-shot events (crackles, drips) are written circularly, so one that
 *     starts near the end simply rings on at the start of the loop
 * Pure functions: testable and analysable without Web Audio.
 */
import type { AmbientLayerId } from './ambientOptions';

/** Loop lengths differ so the layers never re-align into an audible pattern. */
export const AMBIENT_LOOP_SECONDS: Record<AmbientLayerId, number> = {
  fire: 9, rain: 11, wind: 14, waves: 17, stream: 13, insects: 19,
};

/** A calm sample rate: ambient layers carry little above 10 kHz. */
export const AMBIENT_SAMPLE_RATE = 24000;

export type StereoLoop = {
  left: Float32Array<ArrayBuffer>;
  right: Float32Array<ArrayBuffer>;
};

const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

type Rng = () => number;

const gaussian = (rng: Rng) => {
  const u = Math.max(1e-9, rng());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
};

class Biquad {
  private b0 = 1;
  private b1 = 0;
  private b2 = 0;
  private a1 = 0;
  private a2 = 0;
  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;

  private set(b0: number, b1: number, b2: number, a0: number, a1: number, a2: number) {
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = a1 / a0;
    this.a2 = a2 / a0;
  }

  lowpass(fc: number, q: number, fs: number) {
    const w = (2 * Math.PI * Math.min(fc, fs * 0.45)) / fs;
    const alpha = Math.sin(w) / (2 * q);
    const cos = Math.cos(w);
    this.set((1 - cos) / 2, 1 - cos, (1 - cos) / 2, 1 + alpha, -2 * cos, 1 - alpha);
    return this;
  }

  highpass(fc: number, q: number, fs: number) {
    const w = (2 * Math.PI * Math.min(fc, fs * 0.45)) / fs;
    const alpha = Math.sin(w) / (2 * q);
    const cos = Math.cos(w);
    this.set((1 + cos) / 2, -(1 + cos), (1 + cos) / 2, 1 + alpha, -2 * cos, 1 - alpha);
    return this;
  }

  bandpass(fc: number, q: number, fs: number) {
    const w = (2 * Math.PI * Math.min(fc, fs * 0.45)) / fs;
    const alpha = Math.sin(w) / (2 * q);
    const cos = Math.cos(w);
    this.set(alpha, 0, -alpha, 1 + alpha, -2 * cos, 1 - alpha);
    return this;
  }

  process(x: number) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

const rms = (data: Float32Array) => {
  let sum = 0;
  for (let i = 0; i < data.length; i += 1) sum += data[i] * data[i];
  return Math.sqrt(sum / Math.max(1, data.length)) || 1e-9;
};

const normalizeRms = (data: Float32Array) => {
  const gain = 1 / rms(data);
  for (let i = 0; i < data.length; i += 1) data[i] *= gain;
  return data;
};

const db = (x: number) => 10 ** (x / 20);

const smooth = (rng: Rng, length: number, sampleRate: number, hz: number, depth: number) => {
  const lp = new Biquad().lowpass(hz, 0.7, sampleRate);
  const raw = new Float32Array(length);
  for (let i = 0; i < length; i += 1) raw[i] = lp.process(gaussian(rng));
  normalizeRms(raw);
  let mean = 0;
  for (let i = 0; i < length; i += 1) {
    raw[i] = Math.exp(depth * raw[i]);
    mean += raw[i];
  }
  mean /= Math.max(1, length);
  for (let i = 0; i < length; i += 1) raw[i] /= mean;
  return raw;
};

/**
 * Make a bed seamless: render `length + fade` samples and equal-power cross-fade
 * the extra tail into the head.
 */
const toLoop = (source: Float32Array, length: number, fade: number): Float32Array<ArrayBuffer> => {
  const out = new Float32Array(length);
  out.set(source.subarray(0, length));
  for (let i = 0; i < fade; i += 1) {
    const t = i / fade;
    out[i] = source[i] * Math.sin((t * Math.PI) / 2) + source[length + i] * Math.cos((t * Math.PI) / 2);
  }
  return out;
};

/** Add `value` at a sample index that wraps, so events ring across the loop point. */
const addWrapped = (target: Float32Array, index: number, value: number) => {
  target[((index % target.length) + target.length) % target.length] += value;
};

const peakNormalize = (left: Float32Array, right: Float32Array, peak: number) => {
  let max = 1e-9;
  for (let i = 0; i < left.length; i += 1) max = Math.max(max, Math.abs(left[i]), Math.abs(right[i]));
  const gain = peak / max;
  for (let i = 0; i < left.length; i += 1) {
    left[i] *= gain;
    right[i] *= gain;
  }
};

/* ── 火の音: a low, living roar with an occasional crackle ── */
const renderFire = (sampleRate: number, seconds: number, rng: Rng): StereoLoop => {
  const length = Math.floor(sampleRate * seconds);
  const fade = Math.floor(sampleRate * 0.4);
  const total = length + fade;

  const channel = () => {
    const rumbleFilters = [new Biquad().lowpass(150, 0.7, sampleRate), new Biquad().lowpass(150, 0.7, sampleRate)];
    const bodyFilters = [new Biquad().bandpass(430, 0.8, sampleRate), new Biquad().lowpass(1100, 0.7, sampleRate)];
    const rumble = new Float32Array(total);
    const body = new Float32Array(total);
    for (let i = 0; i < total; i += 1) {
      let a = rng() * 2 - 1;
      let b = rng() * 2 - 1;
      for (const f of rumbleFilters) a = f.process(a);
      for (const f of bodyFilters) b = f.process(b);
      rumble[i] = a;
      body[i] = b;
    }
    normalizeRms(rumble);
    normalizeRms(body);
    const surgeA = smooth(rng, total, sampleRate, 2.4, 0.3);
    const surgeB = smooth(rng, total, sampleRate, 6, 0.5);
    const bed = new Float32Array(total);
    for (let i = 0; i < total; i += 1) {
      bed[i] = rumble[i] * db(-19) * surgeA[i] + body[i] * db(-24) * surgeB[i];
    }
    return toLoop(bed, length, fade);
  };

  const left = channel();
  const right = channel();

  // Crackles: Poisson events; a tick is a ~1 ms resonant burst, a pop adds a low thump.
  let t = 0.05;
  while (t < seconds) {
    t += -Math.log(Math.max(1e-9, rng())) / 11;
    const start = Math.floor(t * sampleRate);
    const pop = rng() < 0.3;
    const gain = Math.min(0.4, db(-23 + 7 * gaussian(rng)));
    const pan = (rng() * 2 - 1) * 0.8;
    const gl = Math.cos(((pan + 1) * Math.PI) / 4);
    const gr = Math.sin(((pan + 1) * Math.PI) / 4);
    const resonator = new Biquad().bandpass(1500 * 5 ** rng(), 2 + rng() * 5, sampleRate);
    const tau = Math.max(2, (0.0006 + rng() * 0.0012) * sampleRate);
    for (let n = 0; n < Math.floor(0.008 * sampleRate); n += 1) {
      const v = resonator.process((rng() * 2 - 1) * Math.exp(-n / tau)) * gain * 2.2;
      addWrapped(left, start + n, v * gl);
      addWrapped(right, start + n, v * gr);
    }
    if (pop) {
      const f = 110 + rng() * 190;
      const decay = (0.01 + rng() * 0.012) * sampleRate;
      for (let n = 0; n < decay * 5; n += 1) {
        const v = Math.sin((2 * Math.PI * f * n) / sampleRate) * Math.exp(-n / decay) * gain * 0.9;
        addWrapped(left, start + n, v * gl);
        addWrapped(right, start + n, v * gr);
      }
    }
  }

  peakNormalize(left, right, 0.85);
  return { left, right };
};

/* ── 雨だれ: drips from leaves over a faint patter ── */
const renderRain = (sampleRate: number, seconds: number, rng: Rng): StereoLoop => {
  const length = Math.floor(sampleRate * seconds);
  const fade = Math.floor(sampleRate * 0.4);
  const total = length + fade;

  const channel = () => {
    const band = [new Biquad().bandpass(3200, 0.6, sampleRate), new Biquad().highpass(1400, 0.7, sampleRate)];
    const patter = new Float32Array(total);
    for (let i = 0; i < total; i += 1) {
      let x = rng() * 2 - 1;
      for (const f of band) x = f.process(x);
      patter[i] = x;
    }
    normalizeRms(patter);
    const swell = smooth(rng, total, sampleRate, 0.5, 0.35);
    const bed = new Float32Array(total);
    for (let i = 0; i < total; i += 1) bed[i] = patter[i] * db(-33) * swell[i];
    return toLoop(bed, length, fade);
  };

  const left = channel();
  const right = channel();

  // Drips: a short, rising water "bloop" with a hint of click.
  let t = 0.1;
  while (t < seconds) {
    t += 0.12 + -Math.log(Math.max(1e-9, rng())) / 3.6;
    const start = Math.floor(t * sampleRate);
    const f0 = 650 + rng() * 1100;
    const life = (0.035 + rng() * 0.05) * sampleRate;
    const gain = Math.min(0.5, db(-18 + 7 * gaussian(rng)));
    const pan = (rng() * 2 - 1) * 0.85;
    const gl = Math.cos(((pan + 1) * Math.PI) / 4);
    const gr = Math.sin(((pan + 1) * Math.PI) / 4);
    let phase = 0;
    for (let n = 0; n < life * 4; n += 1) {
      const time = n / sampleRate;
      const f = f0 * (1 + 3.2 * time); // the pitch climbs as the bubble closes
      phase += (2 * Math.PI * f) / sampleRate;
      const click = n < 6 ? (rng() * 2 - 1) * 0.5 : 0;
      const v = (Math.sin(phase) * Math.exp(-n / life) + click) * gain;
      addWrapped(left, start + n, v * gl);
      addWrapped(right, start + n, v * gr);
    }
  }

  peakNormalize(left, right, 0.85);
  return { left, right };
};

/* ── 夜の風: slow gusts through a drifting band ── */
const renderWind = (sampleRate: number, seconds: number, rng: Rng): StereoLoop => {
  const length = Math.floor(sampleRate * seconds);
  const fade = Math.floor(sampleRate * 0.6);
  const total = length + fade;
  const block = 64;

  const channel = () => {
    const out = new Float32Array(total);
    const filter = new Biquad();
    const lowShelf = new Biquad().lowpass(900, 0.6, sampleRate);
    const drift = smooth(rng, total, sampleRate, 0.16, 0.5); // centre frequency wander
    const gust = smooth(rng, total, sampleRate, 0.09, 0.8); // how hard it blows
    for (let i = 0; i < total; i += 1) {
      if (i % block === 0) filter.bandpass(160 + 340 * Math.min(1.6, drift[i]) / 1.6, 0.9, sampleRate);
      const x = lowShelf.process(filter.process(rng() * 2 - 1));
      out[i] = x * gust[i];
    }
    normalizeRms(out);
    for (let i = 0; i < total; i += 1) out[i] *= db(-12);
    return toLoop(out, length, fade);
  };

  const left = channel();
  const right = channel();
  peakNormalize(left, right, 0.8);
  return { left, right };
};

/* ── 波音: a rolling low wash followed by a thinner surf hiss ── */
const renderWaves = (sampleRate: number, seconds: number, rng: Rng): StereoLoop => {
  const length = Math.floor(sampleRate * seconds);
  const fade = Math.min(Math.floor(sampleRate * 0.5), length);
  const phaseOffset = rng();

  const channel = (offset: number) => {
    const wash = new Biquad().bandpass(190, 0.5, sampleRate);
    const foam = new Biquad().bandpass(1490, 0.6, sampleRate);
    const bed = new Float32Array(length + fade);
    for (let i = 0; i < bed.length; i += 1) {
      const time = i / length + phaseOffset;
      const swell = 0.5 + 0.5 * Math.cos(2 * Math.PI * (3 * time + offset));
      const crest = 0.5 + 0.5 * Math.cos(2 * Math.PI * (3 * time + offset - 0.19));
      const tide = 0.82 + 0.18 * Math.sin(2 * Math.PI * time);
      const noise = rng() * 2 - 1;
      bed[i] = tide * (
        wash.process(noise) * (0.18 + 1.7 * swell ** 2)
        + foam.process(noise) * (0.08 + 0.55 * crest ** 3)
      );
    }
    return toLoop(bed, length, fade);
  };

  const left = channel(0);
  const right = channel(0.025);
  peakNormalize(left, right, 0.8);
  return { left, right };
};

/* ── せせらぎ: a continuous soft flow with restless, higher bubbles ── */
const renderStream = (sampleRate: number, seconds: number, rng: Rng): StereoLoop => {
  const length = Math.floor(sampleRate * seconds);
  const fade = Math.min(Math.floor(sampleRate * 0.4), length);

  const channel = () => {
    const current = new Biquad().bandpass(530, 0.62, sampleRate);
    const bubbles = new Biquad();
    const bed = new Float32Array(length + fade);
    const drift = smooth(rng, bed.length, sampleRate, 3, 0.45);
    for (let i = 0; i < bed.length; i += 1) {
      if (i % 64 === 0) bubbles.bandpass(950 + 1000 * Math.min(2, drift[i]), 2.2, sampleRate);
      const noise = rng() * 2 - 1;
      bed[i] = current.process(noise) * 0.72 + bubbles.process(noise) * 0.68 * drift[i];
    }
    return toLoop(bed, length, fade);
  };

  const left = channel();
  const right = channel();
  peakNormalize(left, right, 0.79);
  return { left, right };
};

/* ── 虫の声: alternating groups of short, softly pitched evening chirps ── */
const renderInsects = (sampleRate: number, seconds: number, rng: Rng): StereoLoop => {
  const length = Math.floor(sampleRate * seconds);
  const left = new Float32Array(length);
  const right = new Float32Array(length);

  let time = rng() * 0.6;
  while (time < seconds) {
    const pitch = 2200 + rng() * 1200;
    const duration = 0.23 + rng() * 0.32;
    const pan = 0.18 + rng() * 0.64;
    const gain = 0.22 + rng() * 0.4;
    const start = Math.floor(time * sampleRate);
    const samples = Math.floor(duration * sampleRate);
    const trills = 3 + Math.floor(rng() * 5);
    for (let i = 0; i < samples; i += 1) {
      const progress = i / samples;
      const secondsIntoChirp = i / sampleRate;
      const pulse = Math.sin(Math.PI * progress * trills) ** 4;
      const envelope = Math.sin(Math.PI * progress) * pulse;
      const tone = Math.sin(2 * Math.PI * secondsIntoChirp * (pitch - 100 * progress));
      const texture = (rng() * 2 - 1) * 0.08;
      const sound = (tone + texture) * envelope * gain;
      addWrapped(left, start + i, sound * Math.sqrt(1 - pan));
      addWrapped(right, start + i, sound * Math.sqrt(pan));
    }
    time += 0.36 + rng() * 0.88;
  }

  peakNormalize(left, right, 0.75);
  return { left, right };
};

const RENDER_LAYERS: Record<AmbientLayerId, typeof renderFire> = {
  fire: renderFire, rain: renderRain, wind: renderWind,
  waves: renderWaves, stream: renderStream, insects: renderInsects,
};

const SEED_OFFSET: Record<AmbientLayerId, number> = {
  fire: 11, rain: 23, wind: 37, waves: 53, stream: 79, insects: 97,
};

/** Render one loopable stereo layer. Deterministic for a given seed. */
export const renderAmbientLayer = (
  layer: AmbientLayerId,
  sampleRate: number = AMBIENT_SAMPLE_RATE,
  seed = 1,
  seconds: number = AMBIENT_LOOP_SECONDS[layer],
): StereoLoop => {
  return RENDER_LAYERS[layer](sampleRate, seconds, mulberry32(seed + SEED_OFFSET[layer]));
};

/** Slider (0–100) → linear gain. Quadratic so small settings stay gentle. */
export const LAYER_MAX_GAIN: Record<AmbientLayerId, number> = {
  fire: 0.55, rain: 0.5, wind: 0.42, waves: 0.55, stream: 0.45, insects: 0.32,
};

export const volumeToGain = (layer: AmbientLayerId, volume: number): number => {
  const v = Number.isFinite(volume) ? Math.min(100, Math.max(0, volume)) / 100 : 0;
  return LAYER_MAX_GAIN[layer] * v * v;
};
