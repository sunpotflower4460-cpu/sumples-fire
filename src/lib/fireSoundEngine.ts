import type { BurnSpectacleSound } from './fireBurnSpectacle';
import { renderFire, renderRoomImpulse } from './fireSynth';
import type { FireSamples, FireSynthOptions } from './fireSynth';
import {
  BURN_SEQUENCE_DURATION,
  BURN_TIMING,
  getBurnSequenceDuration,
  REDUCED_MOTION_FACTOR,
} from './fireAnimationConstants';

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

type SoundClock = {
  factor: number;
  ignite: number;
  burning: number;
  carbonizing: number;
  complete: number;
};

type SoundDecorator = (
  context: AudioContext,
  master: AudioNode,
  start: number,
  clock: SoundClock,
) => void;

let audioContext: AudioContext | null = null;
let crackleBuffer: AudioBuffer | null = null;

/** Sound is authored against the same timestamps as the visual ritual. */
export const FIRE_SOUND_DURATION_S = BURN_SEQUENCE_DURATION / 1000;

const IGNITE_S = BURN_TIMING.IGNITE_END / 1000;
const BURNING_S = BURN_TIMING.BURNING_END / 1000;
const CARBONIZING_S = BURN_TIMING.CARBONIZING_END / 1000;
const MIN_EVENT_S = 0.04;

export const getFireSoundDuration = (reduceMotion = false) => (
  getBurnSequenceDuration(reduceMotion) / 1000
);

const getSoundClock = (reduceMotion: boolean): SoundClock => {
  const factor = reduceMotion ? REDUCED_MOTION_FACTOR : 1;
  return {
    factor,
    ignite: IGNITE_S * factor,
    burning: BURNING_S * factor,
    carbonizing: CARBONIZING_S * factor,
    complete: getFireSoundDuration(reduceMotion),
  };
};

const scaledDuration = (seconds: number, factor: number) => Math.max(MIN_EVENT_S, seconds * factor);

const getAudioContext = async () => {
  if (typeof window === 'undefined') return null;

  const AudioContextConstructor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!AudioContextConstructor) return null;

  try {
    if (!audioContext) {
      audioContext = new AudioContextConstructor();
    }

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    return audioContext;
  } catch {
    return null;
  }
};

const createNoiseBuffer = (context: AudioContext) => {
  const length = Math.floor(context.sampleRate * 2.2);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {
    const decay = 1 - i / length;
    const sparseCrackle = Math.random() > 0.955 ? Math.random() * 2 - 1 : 0;
    const softNoise = (Math.random() * 2 - 1) * 0.1;
    data[i] = (sparseCrackle + softNoise) * (0.35 + decay * 0.65);
  }

  return buffer;
};

const scheduleNoise = (
  context: AudioContext,
  destination: AudioNode,
  options: {
    start: number;
    duration: number;
    gain: number;
    frequency: number;
    q?: number;
    type?: BiquadFilterType;
    pan?: number;
  },
) => {
  crackleBuffer ??= createNoiseBuffer(context);

  const source = context.createBufferSource();
  source.buffer = crackleBuffer;

  const filter = context.createBiquadFilter();
  filter.type = options.type ?? 'bandpass';
  filter.frequency.setValueAtTime(options.frequency, options.start);
  filter.Q.setValueAtTime(options.q ?? 0.9, options.start);

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, options.start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, options.gain), options.start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, options.start + options.duration);

  const panNode = typeof context.createStereoPanner === 'function'
    ? context.createStereoPanner()
    : null;
  if (panNode) {
    panNode.pan.setValueAtTime(options.pan ?? 0, options.start);
  }

  source.connect(filter);
  filter.connect(gain);
  if (panNode) {
    gain.connect(panNode);
    panNode.connect(destination);
  } else {
    gain.connect(destination);
  }
  source.start(options.start);
  source.stop(options.start + options.duration + 0.04);
};

const scheduleTone = (
  context: AudioContext,
  destination: AudioNode,
  options: {
    start: number;
    duration: number;
    frequency: number;
    endFrequency?: number;
    gain: number;
    type?: OscillatorType;
    attack?: number;
  },
) => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = options.type ?? 'sine';
  oscillator.frequency.setValueAtTime(options.frequency, options.start);
  if (options.endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(20, options.endFrequency),
      options.start + options.duration,
    );
  }

  const attack = options.attack ?? 0.012;
  gain.gain.setValueAtTime(0.0001, options.start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, options.gain), options.start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, options.start + options.duration);

  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(options.start);
  oscillator.stop(options.start + options.duration + 0.04);
};

const createMaster = (context: AudioContext, durationS = FIRE_SOUND_DURATION_S) => {
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-14, context.currentTime);
  compressor.knee.setValueAtTime(12, context.currentTime);
  compressor.ratio.setValueAtTime(4, context.currentTime);
  compressor.attack.setValueAtTime(0.004, context.currentTime);
  compressor.release.setValueAtTime(0.18, context.currentTime);

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.82, context.currentTime);

  compressor.connect(gain);
  gain.connect(context.destination);

  const hangMs = Math.ceil(durationS * 1000) + 320;
  window.setTimeout(() => {
    try {
      compressor.disconnect();
      gain.disconnect();
    } catch {
      // already torn down
    }
  }, hangMs);

  return compressor;
};

/* ── Procedural fire samples ─────────────────────────────── */

const SAMPLE_RATE = 44100;
const POOL_SIZE = 2;

let roomImpulse: AudioBuffer | null = null;
let seedCounter = (Date.now() & 0xffff) + 1;
const nextSeed = () => {
  seedCounter = (seedCounter * 1664525 + 1013904223) >>> 0;
  return seedCounter;
};

/**
 * AudioBuffers are not tied to a context, so they can be rendered before the
 * first user gesture (when no running AudioContext exists yet).
 */
const makeAudioBuffer = (samples: FireSamples, sampleRate: number): AudioBuffer | null => {
  try {
    const buffer = typeof AudioBuffer === 'function'
      ? new AudioBuffer({ length: samples.left.length, numberOfChannels: 2, sampleRate })
      : null;
    if (buffer) {
      buffer.copyToChannel(samples.left, 0);
      buffer.copyToChannel(samples.right, 1);
      return buffer;
    }
  } catch {
    // fall through to the offline-context path
  }

  try {
    const OfflineCtor = window.OfflineAudioContext
      ?? (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;
    if (!OfflineCtor) return null;
    const buffer = new OfflineCtor(2, 1, sampleRate).createBuffer(2, samples.left.length, sampleRate);
    buffer.copyToChannel(samples.left, 0);
    buffer.copyToChannel(samples.right, 1);
    return buffer;
  } catch {
    return null;
  }
};

const renderToBuffer = (options: Omit<FireSynthOptions, 'sampleRate'>) => (
  makeAudioBuffer(renderFire({ ...options, sampleRate: SAMPLE_RATE }), SAMPLE_RATE)
);

const getRoomImpulse = () => {
  if (!roomImpulse) {
    roomImpulse = makeAudioBuffer(renderRoomImpulse(SAMPLE_RATE), SAMPLE_RATE);
  }
  return roomImpulse;
};

const renderRitualBuffer = (reduceMotion: boolean) => {
  const clock = getSoundClock(reduceMotion);
  return renderToBuffer({
    duration: clock.complete,
    seed: nextSeed(),
    ignition: true,
    phases: { ignite: clock.ignite, burning: clock.burning, carbonizing: clock.carbonizing },
    peak: 0.92,
  });
};

const ritualPool = new Map<boolean, AudioBuffer[]>();
let refillScheduled = false;

const scheduleIdle = (task: () => void) => {
  const idle = (window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  }).requestIdleCallback;
  if (typeof idle === 'function') {
    idle(task, { timeout: 1500 });
  } else if (typeof window.setTimeout === 'function') {
    window.setTimeout(task, 250);
  }
};

/** Keep a couple of freshly rendered rituals ready so a tap never waits on DSP. */
const refillRitualPool = (reduceMotion: boolean) => {
  if (typeof window === 'undefined' || refillScheduled) return;
  refillScheduled = true;
  scheduleIdle(() => {
    refillScheduled = false;
    try {
      const pool = ritualPool.get(reduceMotion) ?? [];
      if (pool.length >= POOL_SIZE) return;
      const buffer = renderRitualBuffer(reduceMotion);
      if (buffer) {
        pool.push(buffer);
        ritualPool.set(reduceMotion, pool);
      }
      if (pool.length < POOL_SIZE && buffer) refillRitualPool(reduceMotion);
    } catch {
      // Pre-rendering is an optimisation; playback falls back to rendering on demand.
    }
  });
};

const takeRitualBuffer = (reduceMotion: boolean) => {
  const pool = ritualPool.get(reduceMotion);
  const ready = pool?.shift() ?? null;
  refillRitualPool(reduceMotion);
  return ready ?? renderRitualBuffer(reduceMotion);
};

/** Pre-render fire sounds while the browser is idle. Safe to call repeatedly. */
export const prepareFireSounds = (reduceMotion = false) => {
  if (typeof window === 'undefined') return;
  try {
    getRoomImpulse();
    refillRitualPool(reduceMotion);
  } catch {
    // never let warm-up break playback
  }
};

/**
 * Play a rendered buffer with a touch of room: dry signal plus a short
 * convolution tail so the fire sits in a space instead of inside the speaker.
 */
const playBuffer = (
  context: AudioContext,
  master: AudioNode,
  buffer: AudioBuffer,
  start: number,
  options: { gain?: number; wet?: number } = {},
) => {
  const source = context.createBufferSource();
  source.buffer = buffer;

  const dry = context.createGain();
  dry.gain.setValueAtTime(options.gain ?? 1, start);
  source.connect(dry);
  dry.connect(master);

  const impulse = getRoomImpulse();
  if (impulse && (options.wet ?? 0.16) > 0) {
    const convolver = context.createConvolver();
    convolver.buffer = impulse;
    const wet = context.createGain();
    wet.gain.setValueAtTime((options.wet ?? 0.16) * (options.gain ?? 1), start);
    source.connect(convolver);
    convolver.connect(wet);
    wet.connect(master);
  }

  source.start(start);
  return source;
};

/** A struck-bell tone: inharmonic partials that die at different rates. */
const scheduleBell = (
  context: AudioContext,
  destination: AudioNode,
  options: { start: number; frequency: number; gain: number; duration: number },
) => {
  const partials: Array<[number, number, number]> = [
    [1, 1, 1],
    [2.01, 0.34, 0.6],
    [2.76, 0.22, 0.42],
    [5.4, 0.08, 0.22],
  ];
  partials.forEach(([ratio, level, life]) => {
    scheduleTone(context, destination, {
      start: options.start,
      duration: options.duration * life,
      frequency: options.frequency * ratio,
      gain: options.gain * level,
      type: 'sine',
      attack: 0.004,
    });
  });
};

const playCoreRitual = (
  context: AudioContext,
  master: AudioNode,
  start: number,
  clock: SoundClock,
  reduceMotion: boolean,
) => {
  const dur = (seconds: number) => scaledDuration(seconds, clock.factor);

  // Roar + crackle + ignition + cooling: rendered, not looped.
  const fire = takeRitualBuffer(reduceMotion);
  if (fire) {
    playBuffer(context, master, fire, start, { gain: 1, wet: 0.16 });
  }

  // ── Complete: 解放 — a warm struck-bell arpeggio over the dying embers ──
  const reward = start + clock.carbonizing;
  [
    { at: 0, frequency: 523.25, gain: 0.085 },
    { at: 0.07, frequency: 659.25, gain: 0.075 },
    { at: 0.15, frequency: 783.99, gain: 0.07 },
    { at: 0.24, frequency: 1046.5, gain: 0.06 },
  ].forEach((note) => {
    scheduleBell(context, master, {
      start: reward + note.at * clock.factor,
      frequency: note.frequency,
      gain: note.gain,
      duration: dur(0.5),
    });
  });
};

const playEtherealLayers: SoundDecorator = (context, master, start, clock) => {
  const dur = (seconds: number) => scaledDuration(seconds, clock.factor);
  scheduleTone(context, master, { start, duration: dur(0.7), frequency: 1200, endFrequency: 1860, gain: 0.055, type: 'sine', attack: dur(0.08) });
  scheduleTone(context, master, { start: start + 0.12 * clock.factor, duration: dur(0.62), frequency: 800, endFrequency: 1480, gain: 0.04, type: 'sine', attack: dur(0.1) });
  scheduleTone(context, master, { start: start + clock.carbonizing, duration: dur(0.5), frequency: 1760, endFrequency: 2480, gain: 0.05, type: 'sine' });
};

const playGoldenLayers: SoundDecorator = (context, master, start, clock) => {
  const dur = (seconds: number) => scaledDuration(seconds, clock.factor);
  const reward = start + clock.carbonizing;
  scheduleTone(context, master, { start: reward, duration: dur(0.34), frequency: 880, endFrequency: 1320, gain: 0.09, type: 'sine' });
  scheduleTone(context, master, { start: reward + 0.1 * clock.factor, duration: dur(0.36), frequency: 1100, endFrequency: 1760, gain: 0.07, type: 'sine' });
  scheduleTone(context, master, { start: reward + 0.2 * clock.factor, duration: dur(0.4), frequency: 1320, endFrequency: 1980, gain: 0.06, type: 'sine' });
};

const playExplosiveLayers: SoundDecorator = (context, master, start, clock) => {
  const dur = (seconds: number) => scaledDuration(seconds, clock.factor);
  scheduleNoise(context, master, { start, duration: dur(0.34), gain: 0.62, frequency: 72, q: 0.45, type: 'lowpass' });
  scheduleTone(context, master, { start, duration: dur(0.28), frequency: 48, endFrequency: 26, gain: 0.3, type: 'triangle' });
  [0.05, 0.12, 0.2, 0.3, 0.42].forEach((offset, i) => {
    scheduleNoise(context, master, {
      start: start + offset * clock.factor,
      duration: dur(0.08),
      gain: 0.3 - i * 0.035,
      frequency: 1400 + i * 220,
      q: 7,
      type: 'bandpass',
      pan: i % 2 === 0 ? -0.6 : 0.58,
    });
  });
};

const playDragonLayers: SoundDecorator = (context, master, start, clock) => {
  const dur = (seconds: number) => scaledDuration(seconds, clock.factor);
  scheduleTone(context, master, { start, duration: dur(0.55), frequency: 40, endFrequency: 24, gain: 0.26, type: 'sawtooth', attack: dur(0.04) });
  scheduleTone(context, master, { start: start + clock.ignite, duration: dur(0.9), frequency: 36, endFrequency: 28, gain: 0.12, type: 'sawtooth', attack: dur(0.1) });
  scheduleTone(context, master, { start: start + clock.carbonizing, duration: dur(0.34), frequency: 770, endFrequency: 1320, gain: 0.08, type: 'sine' });
};

const playSoftLayers: SoundDecorator = (context, master, start, clock) => {
  const dur = (seconds: number) => scaledDuration(seconds, clock.factor);
  scheduleTone(context, master, { start: start + clock.carbonizing, duration: dur(0.3), frequency: 1047, endFrequency: 1568, gain: 0.055, type: 'sine' });
  scheduleTone(context, master, { start: start + clock.carbonizing + 0.1 * clock.factor, duration: dur(0.34), frequency: 1175, endFrequency: 1976, gain: 0.04, type: 'sine' });
};

const playMetallicLayers: SoundDecorator = (context, master, start, clock) => {
  const dur = (seconds: number) => scaledDuration(seconds, clock.factor);
  scheduleTone(context, master, { start: start + 0.08 * clock.factor, duration: dur(0.5), frequency: 1480, endFrequency: 2220, gain: 0.06, type: 'sine' });
  scheduleTone(context, master, { start: start + clock.carbonizing, duration: dur(0.42), frequency: 1760, endFrequency: 2640, gain: 0.06, type: 'sine' });
};

const playVoidLayers: SoundDecorator = (context, master, start, clock) => {
  const dur = (seconds: number) => scaledDuration(seconds, clock.factor);
  scheduleTone(context, master, { start, duration: dur(0.8), frequency: 32, endFrequency: 18, gain: 0.2, type: 'sine', attack: dur(0.12) });
  scheduleTone(context, master, { start: start + clock.carbonizing, duration: dur(0.5), frequency: 220, endFrequency: 330, gain: 0.05, type: 'sine', attack: dur(0.08) });
};

const playPhoenixLayers: SoundDecorator = (context, master, start, clock) => {
  const dur = (seconds: number) => scaledDuration(seconds, clock.factor);
  playExplosiveLayers(context, master, start, clock);
  playGoldenLayers(context, master, start, clock);
  scheduleTone(context, master, {
    start: start + clock.carbonizing + 0.18 * clock.factor,
    duration: dur(0.48),
    frequency: 1760,
    endFrequency: 2794,
    gain: 0.07,
    type: 'sine',
  });
};

const playWithProfile = async (decorate?: SoundDecorator, reduceMotion = false) => {
  const context = await getAudioContext();
  if (!context) return false;

  const clock = getSoundClock(reduceMotion);
  const master = createMaster(context, clock.complete);
  const start = context.currentTime + 0.012;
  playCoreRitual(context, master, start, clock, reduceMotion);
  decorate?.(context, master, start, clock);
  return true;
};

export const playFireSequence = async (reduceMotion = false) => playWithProfile(undefined, reduceMotion);

/** A match strike: a small fwoomp, a few snaps, a bright ping. */
export const playSparkSound = async () => {
  const context = await getAudioContext();
  if (!context) return false;

  const master = createMaster(context, 0.7);
  const start = context.currentTime + 0.01;
  const buffer = renderToBuffer({
    duration: 0.62,
    seed: nextSeed(),
    ignition: true,
    roar: 0.55,
    crackle: 1.1,
    phases: { ignite: 0.12, burning: 0.3, carbonizing: 0.5 },
    peak: 0.8,
  });
  if (buffer) playBuffer(context, master, buffer, start, { wet: 0.12 });
  scheduleBell(context, master, { start: start + 0.2, frequency: 1318.5, gain: 0.045, duration: 0.4 });
  return true;
};

export const playSoundPreview = async () => {
  const context = await getAudioContext();
  if (!context) return false;

  const master = createMaster(context, 0.95);
  const start = context.currentTime + 0.01;
  const buffer = renderToBuffer({
    duration: 0.9,
    seed: nextSeed(),
    ignition: true,
    roar: 0.8,
    crackle: 1.3,
    phases: { ignite: 0.2, burning: 0.5, carbonizing: 0.75 },
    peak: 0.85,
  });
  if (buffer) playBuffer(context, master, buffer, start, { wet: 0.15 });
  scheduleBell(context, master, { start: start + 0.28, frequency: 880, gain: 0.05, duration: 0.5 });
  return true;
};

/** Poking the campfire: a flurry of snaps and a brief flare, no ceremony. */
export const playCampfirePoke = async () => {
  const context = await getAudioContext();
  if (!context) return false;

  const master = createMaster(context, 1.1);
  const start = context.currentTime + 0.01;
  const buffer = renderToBuffer({
    duration: 1.05,
    seed: nextSeed(),
    roar: 0.7,
    crackle: 2.3,
    phases: { ignite: 0.25, burning: 0.6, carbonizing: 1.0 },
    peak: 0.8,
  });
  if (buffer) playBuffer(context, master, buffer, start, { wet: 0.14 });
  return true;
};

export const warmUpFireSound = async () => {
  const context = await getAudioContext();
  if (context) prepareFireSounds();
  return Boolean(context);
};

export const playSpectacleSequence = async (
  profile: BurnSpectacleSound,
  reduceMotion = false,
) => {
  switch (profile) {
    case 'ethereal':
      return playWithProfile(playEtherealLayers, reduceMotion);
    case 'golden':
      return playWithProfile(playGoldenLayers, reduceMotion);
    case 'explosive':
      return playWithProfile(playExplosiveLayers, reduceMotion);
    case 'dragon':
      return playWithProfile(playDragonLayers, reduceMotion);
    case 'soft':
      return playWithProfile(playSoftLayers, reduceMotion);
    case 'metallic':
      return playWithProfile(playMetallicLayers, reduceMotion);
    case 'void':
      return playWithProfile(playVoidLayers, reduceMotion);
    case 'phoenix':
      return playWithProfile(playPhoenixLayers, reduceMotion);
    case 'normal':
    default:
      return playFireSequence(reduceMotion);
  }
};
