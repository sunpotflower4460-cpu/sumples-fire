/**
 * fireSynth — sample-accurate procedural fire audio.
 *
 * A real campfire is four things layered together, and this renders each one
 * explicitly instead of looping a noise burst through a filter:
 *
 *   1. Roar     low rumble + chest-height body + airy whoosh, each surging at its
 *               own irregular rate (random-walk flicker, never a fixed LFO)
 *   2. Crackle  Poisson-distributed events: tiny ticks, wood pops (a low thump
 *               under a tick) and sharp snaps (a short cluster ringing a
 *               resonance). Events arrive in clusters, vary in loudness on a
 *               log-normal curve, and are panned and micro-delayed for width
 *   3. Ignition a gas "whoomph": rising-then-falling filtered noise, a pitch
 *               dropping sub thump and a sharp ignition hiss
 *   4. Cooling  a soft hiss that rises as the flame dies, then silence
 *
 * Everything here is pure (no Web Audio) so it can be unit-tested, analysed
 * offline, and rendered into an AudioBuffer by the engine.
 */

export type FireSynthPhases = {
  /** End of the ignite phase, in seconds from the start. */
  ignite: number;
  /** End of the burning phase. */
  burning: number;
  /** End of the carbonizing phase. */
  carbonizing: number;
};

export type FireSynthOptions = {
  sampleRate: number;
  /** Total length in seconds. */
  duration: number;
  /** Deterministic seed — different seeds give different (but similar) fires. */
  seed?: number;
  /** Phase boundaries; defaults to a steady burn that never cools. */
  phases?: FireSynthPhases;
  /** Master roar loudness multiplier (1 = normal). */
  roar?: number;
  /** Crackle density multiplier (1 = normal). */
  crackle?: number;
  /** Whether to render the opening "whoomph". */
  ignition?: boolean;
  /** Peak level the result is normalised to (0..1). */
  peak?: number;
};

export type FireSamples = {
  left: Float32Array<ArrayBuffer>;
  right: Float32Array<ArrayBuffer>;
};

export const mulberry32 = (seed: number) => {
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

/** Box–Muller; one call returns one standard-normal sample. */
const gaussian = (rng: Rng) => {
  const u = Math.max(1e-9, rng());
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
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

  reset() {
    this.x1 = 0;
    this.x2 = 0;
    this.y1 = 0;
    this.y2 = 0;
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

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

const rms = (data: Float32Array) => {
  let sum = 0;
  for (let i = 0; i < data.length; i += 1) sum += data[i] * data[i];
  return Math.sqrt(sum / Math.max(1, data.length)) || 1e-9;
};

const normalizeRms = (data: Float32Array, target = 1) => {
  const gain = target / rms(data);
  for (let i = 0; i < data.length; i += 1) data[i] *= gain;
  return data;
};

const filteredNoise = (length: number, rng: Rng, stages: Biquad[]) => {
  const out = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    let x = rng() * 2 - 1;
    for (let s = 0; s < stages.length; s += 1) x = stages[s].process(x);
    out[i] = x;
  }
  return normalizeRms(out);
};

/**
 * Irregular, always-positive surge curve with mean ≈ 1.
 * `rate` is roughly how often it surges per second; `depth` how strongly.
 */
const flickerCurve = (length: number, sampleRate: number, rng: Rng, rate: number, depth: number) => {
  const lp = new Biquad().lowpass(rate, 0.7, sampleRate);
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

/** How hard the final stage leans on tanh; low enough not to smear crackle transients. */
const SOFT_CLIP_DRIVE = 1.3;

const defaultPhases = (duration: number): FireSynthPhases => ({
  ignite: Math.min(0.4, duration * 0.2),
  burning: duration * 2,
  carbonizing: duration * 2,
});

/** Overall loudness of the sustained roar over time. */
const roarEnvelope = (t: number, duration: number, p: FireSynthPhases) => {
  const rise = 0.18 + 0.82 * smoothstep(0, Math.max(0.12, p.ignite * 0.9), t);
  if (t <= p.burning) return rise;

  const coolSpan = Math.max(0.05, p.carbonizing - p.burning);
  const cooled = 1 - 0.72 * smoothstep(0, coolSpan, t - p.burning);
  const tail = t > p.carbonizing
    ? 1 - 0.55 * smoothstep(0, Math.max(0.05, duration - p.carbonizing), t - p.carbonizing)
    : 1;
  return rise * cooled * tail;
};

/** Crackle events per second at time t. */
const crackleRate = (t: number, p: FireSynthPhases, duration: number) => {
  if (t < p.ignite) return 12 + 24 * smoothstep(0, p.ignite, t);
  if (t < p.burning) return 26;
  if (t < p.carbonizing) {
    const k = smoothstep(0, Math.max(0.05, p.carbonizing - p.burning), t - p.burning);
    return 26 - 19 * k;
  }
  const k = smoothstep(0, Math.max(0.05, duration - p.carbonizing), t - p.carbonizing);
  return 7 - 4.5 * k;
};

type CrackleKind = 'tick' | 'pop' | 'snap';

/**
 * Add one crackle event into the stereo mix.
 * A tick is band-limited noise with a ~1 ms decay; a pop adds a damped low
 * thump beneath it; a snap is a rapid cluster ringing a resonance.
 */
const addCrackle = (
  left: Float32Array,
  right: Float32Array,
  sampleRate: number,
  startSample: number,
  kind: CrackleKind,
  gain: number,
  pan: number,
  rng: Rng,
) => {
  const length = left.length;
  const resonator = new Biquad();
  const centre = 1500 * Math.pow(5, rng()); // 1.5–7.5 kHz
  const q = 1.8 + rng() * 5;
  resonator.bandpass(centre, q, sampleRate);

  const angle = ((pan + 1) * Math.PI) / 4;
  const gl = Math.cos(angle);
  const gr = Math.sin(angle);
  // Haas micro-delay: sounds a hair earlier on the louder side.
  const delay = Math.floor((rng() * 0.0006) * sampleRate);
  const delayLeft = pan > 0 ? delay : 0;
  const delayRight = pan < 0 ? delay : 0;

  const emit = (offset: number, value: number) => {
    const i = startSample + offset;
    if (i < 0 || i >= length) return;
    const il = i + delayLeft;
    const ir = i + delayRight;
    if (il < length) left[il] += value * gl;
    if (ir < length) right[ir] += value * gr;
  };

  const burst = (offsetSamples: number, strength: number, tauMs: number, ringMs: number) => {
    const tau = Math.max(2, (tauMs / 1000) * sampleRate);
    const ring = Math.max(8, Math.floor((ringMs / 1000) * sampleRate));
    resonator.reset();
    for (let n = 0; n < ring; n += 1) {
      const env = Math.exp(-n / tau);
      emit(offsetSamples + n, resonator.process((rng() * 2 - 1) * env) * strength);
    }
  };

  if (kind === 'tick') {
    burst(0, gain * 2.2, 0.6 + rng() * 1.1, 6);
    return;
  }

  if (kind === 'pop') {
    burst(0, gain * 2.4, 0.9 + rng() * 1.5, 9);
    // The thump: damped sine, 110–300 Hz, 10–22 ms decay.
    const f = 110 + rng() * 190;
    const tau = ((10 + rng() * 12) / 1000) * sampleRate;
    const n = Math.floor(tau * 5);
    for (let k = 0; k < n; k += 1) {
      emit(k, Math.sin((2 * Math.PI * f * k) / sampleRate) * Math.exp(-k / tau) * gain * 0.9);
    }
    return;
  }

  // snap: 2–4 sub-bursts, 3–12 ms apart, last one rings longest
  const parts = 2 + Math.floor(rng() * 3);
  let offset = 0;
  for (let part = 0; part < parts; part += 1) {
    const last = part === parts - 1;
    burst(offset, gain * (last ? 3 : 2) * (1 - part * 0.12), last ? 2.4 : 0.8, last ? 16 : 7);
    offset += Math.floor(((3 + rng() * 9) / 1000) * sampleRate);
  }
  const f = 140 + rng() * 120;
  const tau = (0.016 * sampleRate);
  for (let k = 0; k < tau * 5; k += 1) {
    emit(k, Math.sin((2 * Math.PI * f * k) / sampleRate) * Math.exp(-k / tau) * gain * 1.1);
  }
};

const renderCrackles = (
  left: Float32Array,
  right: Float32Array,
  sampleRate: number,
  duration: number,
  phases: FireSynthPhases,
  density: number,
  rng: Rng,
) => {
  let t = 0.01;
  const maxEvents = Math.ceil(duration * 90 * Math.max(0.2, density));
  let events = 0;

  while (t < duration && events < maxEvents) {
    const rate = crackleRate(t, phases, duration) * density;
    if (rate <= 0.01) break;
    t += -Math.log(Math.max(1e-9, rng())) / rate;
    if (t >= duration) break;

    const kindRoll = rng();
    const kind: CrackleKind = kindRoll < 0.64 ? 'tick' : kindRoll < 0.9 ? 'pop' : 'snap';
    // Log-normal loudness: most are quiet, a few cut through.
    const levelDb = -20.5 + 7.5 * gaussian(rng) + (kind === 'snap' ? 7 : kind === 'pop' ? 3 : 0);
    const gain = Math.min(0.5, Math.pow(10, levelDb / 20));
    const pan = (rng() * 2 - 1) * 0.85;
    const start = Math.floor(t * sampleRate);
    addCrackle(left, right, sampleRate, start, kind, gain, pan, rng);
    events += 1;

    // Crackles come in trains — wood fibres letting go one after another.
    if (kind !== 'tick' && rng() < 0.4) {
      const followers = 2 + Math.floor(rng() * 4);
      let ft = t;
      for (let f = 0; f < followers; f += 1) {
        ft += 0.012 + rng() * 0.07;
        if (ft >= duration) break;
        addCrackle(
          left,
          right,
          sampleRate,
          Math.floor(ft * sampleRate),
          'tick',
          gain * Math.pow(0.7, f + 1) * (0.6 + rng() * 0.5),
          pan + (rng() * 2 - 1) * 0.25,
          rng,
        );
        events += 1;
      }
    }
  }
};

/** Gas ignition: "fwoomp" — noise that opens up then closes, over a dropping sub. */
const renderIgnition = (
  left: Float32Array,
  right: Float32Array,
  sampleRate: number,
  rng: Rng,
  strength: number,
) => {
  const length = left.length;
  const span = Math.min(length, Math.floor(sampleRate * 0.7));
  const lpL = new Biquad();
  const lpR = new Biquad();
  const block = 32;

  for (let i = 0; i < span; i += 1) {
    const t = i / sampleRate;
    if (i % block === 0) {
      // Cutoff swells quickly (60 → 1800 Hz) then relaxes (→ 260 Hz).
      const open = smoothstep(0, 0.1, t);
      const close = smoothstep(0.12, 0.6, t);
      const fc = 60 * Math.pow(30, open) * Math.pow(0.14, close);
      lpL.lowpass(fc, 0.6, sampleRate);
      lpR.lowpass(fc * 1.04, 0.6, sampleRate);
    }
    const attack = 1 - Math.exp(-t / 0.012);
    const env = attack * Math.exp(-t / 0.2);
    const nl = lpL.process(rng() * 2 - 1) * env * 5.2;
    const nr = lpR.process(rng() * 2 - 1) * env * 5.2;

    // Sub thump with a falling pitch: 78 → 36 Hz (phase is the integral of that glide).
    const sub = Math.sin(2 * Math.PI * (36 * t + 42 * 0.07 * (1 - Math.exp(-t / 0.07)))) * Math.exp(-t / 0.13) * attack;

    left[i] += (nl + sub * 0.5) * strength;
    right[i] += (nr + sub * 0.5) * strength;
  }

  // The sharp ignition "ff" — a short airy burst on top.
  const hp = new Biquad().highpass(2600, 0.7, sampleRate);
  const sharp = Math.min(length, Math.floor(sampleRate * 0.09));
  for (let i = 0; i < sharp; i += 1) {
    const t = i / sampleRate;
    const env = (1 - Math.exp(-t / 0.004)) * Math.exp(-t / 0.028);
    const v = hp.process(rng() * 2 - 1) * env * 0.5 * strength;
    left[i] += v;
    right[i] += v * 0.92;
  }
};

/**
 * Render a stereo fire sound. Deterministic for a given seed.
 */
export const renderFire = (options: FireSynthOptions): FireSamples => {
  const { sampleRate, duration } = options;
  const seed = options.seed ?? 1;
  const roarLevel = options.roar ?? 1;
  const density = options.crackle ?? 1;
  const peak = options.peak ?? 0.9;
  const phases = options.phases ?? defaultPhases(duration);
  const length = Math.max(1, Math.floor(sampleRate * duration));
  const rng = mulberry32(seed);

  const left = new Float32Array(length);
  const right = new Float32Array(length);

  // ── 1. Roar ──────────────────────────────────────────────
  const makeBands = () => ({
    rumble: filteredNoise(length, rng, [
      new Biquad().lowpass(150, 0.7, sampleRate),
      new Biquad().lowpass(150, 0.7, sampleRate),
    ]),
    // Steep upper skirts keep the roar below ~2 kHz so crackles own the highs.
    body: filteredNoise(length, rng, [
      new Biquad().bandpass(430, 0.8, sampleRate),
      new Biquad().lowpass(1100, 0.7, sampleRate),
    ]),
    whoosh: filteredNoise(length, rng, [
      new Biquad().bandpass(1100, 0.6, sampleRate),
      new Biquad().lowpass(2300, 0.7, sampleRate),
    ]),
    hiss: filteredNoise(length, rng, [new Biquad().highpass(5200, 0.7, sampleRate)]),
  });
  const bandsL = makeBands();
  const bandsR = makeBands();
  const surgeRumble = flickerCurve(length, sampleRate, rng, 2.6, 0.32);
  const surgeBody = flickerCurve(length, sampleRate, rng, 6.5, 0.5);
  const surgeWhoosh = flickerCurve(length, sampleRate, rng, 11, 0.62);

  const db = (x: number) => Math.pow(10, x / 20);
  const gRumble = db(-19);
  const gBody = db(-22);
  const gWhoosh = db(-32);
  const gHiss = db(-50);

  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const env = roarEnvelope(t, duration, phases) * roarLevel;
    // The hiss belongs to a dying fire: it swells while the flame cools.
    const cool = t > phases.burning
      ? smoothstep(0, Math.max(0.1, phases.carbonizing - phases.burning), t - phases.burning)
      : 0;
    const hissEnv = 0.35 + 1.6 * cool;
    const sr = surgeRumble[i];
    const sb = surgeBody[i];
    const sw = surgeWhoosh[i];

    left[i] = env * (
      bandsL.rumble[i] * gRumble * sr
      + bandsL.body[i] * gBody * sb
      + bandsL.whoosh[i] * gWhoosh * sw * (1 - 0.5 * cool)
      + bandsL.hiss[i] * gHiss * hissEnv
    );
    right[i] = env * (
      bandsR.rumble[i] * gRumble * sr
      + bandsR.body[i] * gBody * sb
      + bandsR.whoosh[i] * gWhoosh * sw * (1 - 0.5 * cool)
      + bandsR.hiss[i] * gHiss * hissEnv
    );
  }

  // ── 2. Crackle ───────────────────────────────────────────
  renderCrackles(left, right, sampleRate, duration, phases, density, rng);

  // ── 3. Ignition ──────────────────────────────────────────
  if (options.ignition) {
    renderIgnition(left, right, sampleRate, rng, 0.2);
  }

  // ── Final: gentle tanh saturation, fade-out, peak normalise ──
  const fadeSamples = Math.min(length, Math.floor(sampleRate * 0.14));
  let maxAbs = 1e-9;
  for (let i = 0; i < length; i += 1) {
    left[i] = Math.tanh(left[i] * SOFT_CLIP_DRIVE);
    right[i] = Math.tanh(right[i] * SOFT_CLIP_DRIVE);
    const fromEnd = length - 1 - i;
    if (fromEnd < fadeSamples) {
      const fade = fromEnd / fadeSamples;
      left[i] *= fade;
      right[i] *= fade;
    }
    maxAbs = Math.max(maxAbs, Math.abs(left[i]), Math.abs(right[i]));
  }
  const norm = peak / maxAbs;
  for (let i = 0; i < length; i += 1) {
    left[i] *= norm;
    right[i] *= norm;
  }

  return { left, right };
};

/** Short exponentially-decaying stereo noise impulse response for a small room. */
export const renderRoomImpulse = (sampleRate: number, seconds = 0.42, seed = 7): FireSamples => {
  const length = Math.floor(sampleRate * seconds);
  const rng = mulberry32(seed);
  const left = new Float32Array(length);
  const right = new Float32Array(length);
  const lp = new Biquad().lowpass(5200, 0.6, sampleRate);
  const lpR = new Biquad().lowpass(5200, 0.6, sampleRate);

  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const tailFade = Math.min(1, (length - 1 - i) / (sampleRate * 0.05));
    const env = Math.exp(-t / (seconds * 0.28)) * (1 - Math.exp(-t / 0.004)) * tailFade;
    left[i] = lp.process(rng() * 2 - 1) * env;
    right[i] = lpR.process(rng() * 2 - 1) * env;
  }
  normalizeRms(left, 0.18);
  normalizeRms(right, 0.18);
  return { left, right };
};

/** Analysis helpers (used by tests and the offline spectrogram tool). */
export const measureFire = (samples: FireSamples, sampleRate: number) => {
  const mono = new Float32Array(samples.left.length);
  let peak = 0;
  for (let i = 0; i < mono.length; i += 1) {
    mono[i] = (samples.left[i] + samples.right[i]) / 2;
    peak = Math.max(peak, Math.abs(samples.left[i]), Math.abs(samples.right[i]));
  }

  // Impulsiveness: kurtosis of the 2–9 kHz band's 2 ms RMS envelope.
  const band = new Biquad().highpass(2000, 0.7, sampleRate);
  const hf = new Float32Array(mono.length);
  for (let i = 0; i < mono.length; i += 1) hf[i] = band.process(mono[i]);
  const win = Math.max(1, Math.floor(sampleRate * 0.002));
  const env: number[] = [];
  for (let i = 0; i + win <= hf.length; i += win) {
    let s = 0;
    for (let k = 0; k < win; k += 1) s += hf[i + k] * hf[i + k];
    env.push(Math.sqrt(s / win));
  }
  const mean = env.reduce((a, b) => a + b, 0) / Math.max(1, env.length);
  const variance = env.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, env.length);
  const kurtosis = variance > 0
    ? env.reduce((a, b) => a + (b - mean) ** 4, 0) / Math.max(1, env.length) / (variance * variance)
    : 0;

  // Count envelope peaks that stand 4× above the running median level.
  const sorted = [...env].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] || 1e-9;
  let crackles = 0;
  let armed = true;
  for (let i = 0; i < env.length; i += 1) {
    if (env[i] > median * 4 && armed) {
      crackles += 1;
      armed = false;
    } else if (env[i] < median * 2) {
      armed = true;
    }
  }

  return {
    hfRms: rms(hf),
    peak,
    rms: rms(mono),
    kurtosis,
    crackles,
    seconds: mono.length / sampleRate,
  };
};
