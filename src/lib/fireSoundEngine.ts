import type { BurnSpectacleSound } from './fireBurnSpectacle';
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
  compressor.threshold.setValueAtTime(-16, context.currentTime);
  compressor.knee.setValueAtTime(14, context.currentTime);
  compressor.ratio.setValueAtTime(5, context.currentTime);
  compressor.attack.setValueAtTime(0.003, context.currentTime);
  compressor.release.setValueAtTime(0.16, context.currentTime);

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.78, context.currentTime);

  compressor.connect(gain);
  gain.connect(context.destination);

  const hangMs = Math.ceil(durationS * 1000) + 180;
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

const crackleOffsets = (from: number, to: number, step: number) => {
  const offsets: number[] = [];
  for (let t = from; t < to; t += step) {
    offsets.push(t);
  }
  return offsets;
};

const playCoreRitual = (
  context: AudioContext,
  master: AudioNode,
  start: number,
  clock: SoundClock,
) => {
  const dur = (seconds: number) => scaledDuration(seconds, clock.factor);
  const at = (seconds: number) => start + seconds * clock.factor;

  // ── Ignite: ボッ + whoosh ────────────────────────────────
  scheduleNoise(context, master, {
    start,
    duration: dur(0.28),
    gain: 0.46,
    frequency: 140,
    q: 0.55,
    type: 'lowpass',
  });
  scheduleTone(context, master, {
    start,
    duration: dur(0.22),
    frequency: 92,
    endFrequency: 42,
    gain: 0.24,
    type: 'triangle',
  });
  scheduleTone(context, master, {
    start: at(0.02),
    duration: dur(0.16),
    frequency: 58,
    endFrequency: 32,
    gain: 0.2,
    type: 'sine',
  });
  scheduleNoise(context, master, {
    start: at(0.04),
    duration: dur(0.2),
    gain: 0.18,
    frequency: 2400,
    q: 0.7,
    type: 'highpass',
    pan: -0.35,
  });
  scheduleNoise(context, master, {
    start: at(0.07),
    duration: dur(0.12),
    gain: 0.22,
    frequency: 1900,
    q: 7,
    type: 'bandpass',
    pan: 0.4,
  });

  // ── Burning: roar + stereo パチパチ ──────────────────────
  scheduleNoise(context, master, {
    start: start + clock.ignite,
    duration: clock.burning - clock.ignite,
    gain: 0.14,
    frequency: 180,
    q: 0.45,
    type: 'lowpass',
  });
  scheduleTone(context, master, {
    start: start + clock.ignite,
    duration: clock.burning - clock.ignite + dur(0.08),
    frequency: 52,
    endFrequency: 38,
    gain: 0.1,
    type: 'triangle',
    attack: dur(0.08),
  });

  crackleOffsets(0.16 * clock.factor, clock.ignite, 0.09).forEach((offset, index) => {
    scheduleNoise(context, master, {
      start: start + offset,
      duration: dur(0.055 + (index % 3) * 0.008),
      gain: 0.2 - index * 0.018,
      frequency: 1700 + index * 220,
      q: 6.5,
      type: 'bandpass',
      pan: index % 2 === 0 ? -0.45 : 0.42,
    });
  });

  crackleOffsets(clock.ignite + 0.04 * clock.factor, clock.burning - 0.04 * clock.factor, 0.11)
    .forEach((offset, index) => {
      scheduleNoise(context, master, {
        start: start + offset,
        duration: dur(0.06 + (index % 4) * 0.006),
        gain: 0.17 - (index % 5) * 0.012,
        frequency: 1500 + (index % 6) * 280,
        q: 6,
        type: 'bandpass',
        pan: index % 2 === 0 ? -0.55 : 0.5,
      });
    });

  // ── Carbonizing: サァ, crackle thins out ───────────────────
  scheduleNoise(context, master, {
    start: start + clock.burning,
    duration: clock.carbonizing - clock.burning + dur(0.18),
    gain: 0.11,
    frequency: 760,
    q: 0.4,
    type: 'highpass',
  });
  scheduleTone(context, master, {
    start: start + clock.burning,
    duration: dur(0.42),
    frequency: 70,
    endFrequency: 36,
    gain: 0.08,
    type: 'sine',
    attack: dur(0.05),
  });
  [0.08, 0.22, 0.38].forEach((offset, index) => {
    scheduleNoise(context, master, {
      start: start + clock.burning + offset * clock.factor,
      duration: dur(0.07),
      gain: 0.1 - index * 0.02,
      frequency: 1200 + index * 180,
      q: 5,
      type: 'bandpass',
      pan: index === 1 ? 0.3 : -0.25,
    });
  });

  // ── Complete: 解放の和音 ────────────────────────────────
  const reward = start + clock.carbonizing;
  scheduleTone(context, master, {
    start: reward,
    duration: dur(0.28),
    frequency: 523.25,
    endFrequency: 659.25,
    gain: 0.09,
    type: 'sine',
  });
  scheduleTone(context, master, {
    start: reward + 0.06 * clock.factor,
    duration: dur(0.32),
    frequency: 659.25,
    endFrequency: 783.99,
    gain: 0.075,
    type: 'sine',
  });
  scheduleTone(context, master, {
    start: reward + 0.14 * clock.factor,
    duration: dur(0.38),
    frequency: 783.99,
    endFrequency: 1046.5,
    gain: 0.07,
    type: 'sine',
  });
  scheduleTone(context, master, {
    start: reward + 0.22 * clock.factor,
    duration: dur(0.42),
    frequency: 1046.5,
    endFrequency: 1318.5,
    gain: 0.05,
    type: 'sine',
  });
  scheduleNoise(context, master, {
    start: reward,
    duration: dur(0.2),
    gain: 0.08,
    frequency: 2600,
    q: 0.6,
    type: 'highpass',
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
  playCoreRitual(context, master, start, clock);
  decorate?.(context, master, start, clock);
  return true;
};

export const playFireSequence = async (reduceMotion = false) => playWithProfile(undefined, reduceMotion);

export const playSparkSound = async () => {
  const context = await getAudioContext();
  if (!context) return false;

  const master = createMaster(context);
  const start = context.currentTime + 0.01;
  scheduleNoise(context, master, { start, duration: 0.1, gain: 0.16, frequency: 180, q: 0.7, type: 'lowpass' });
  scheduleTone(context, master, { start, duration: 0.12, frequency: 740, endFrequency: 1180, gain: 0.05, type: 'sine' });
  scheduleNoise(context, master, { start: start + 0.04, duration: 0.08, gain: 0.12, frequency: 2100, q: 6, type: 'bandpass', pan: 0.25 });
  return true;
};

export const playSoundPreview = async () => {
  const context = await getAudioContext();
  if (!context) return false;

  const master = createMaster(context);
  const start = context.currentTime + 0.01;
  scheduleNoise(context, master, { start, duration: 0.16, gain: 0.28, frequency: 150, q: 0.6, type: 'lowpass' });
  scheduleTone(context, master, { start, duration: 0.14, frequency: 82, endFrequency: 46, gain: 0.16, type: 'triangle' });
  scheduleNoise(context, master, { start: start + 0.12, duration: 0.07, gain: 0.14, frequency: 1900, q: 6, type: 'bandpass', pan: 0.3 });
  scheduleTone(context, master, { start: start + 0.22, duration: 0.2, frequency: 880, endFrequency: 1320, gain: 0.06, type: 'sine' });
  return true;
};

export const warmUpFireSound = async () => {
  const context = await getAudioContext();
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
