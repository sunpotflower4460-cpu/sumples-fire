import type { BurnSpectacleSound } from './fireBurnSpectacle';
import { BURN_SEQUENCE_DURATION, BURN_TIMING } from './fireAnimationConstants';

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let audioContext: AudioContext | null = null;
let crackleBuffer: AudioBuffer | null = null;

/** Sound is authored against the same timestamps as the visual ritual. */
export const FIRE_SOUND_DURATION_S = BURN_SEQUENCE_DURATION / 1000;

const IGNITE_S = BURN_TIMING.IGNITE_END / 1000;
const BURNING_S = BURN_TIMING.BURNING_END / 1000;
const CARBONIZING_S = BURN_TIMING.CARBONIZING_END / 1000;

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

const createMaster = (context: AudioContext) => {
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

  const hangMs = Math.ceil(FIRE_SOUND_DURATION_S * 1000) + 180;
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

const playCoreRitual = (context: AudioContext, master: AudioNode, start: number) => {
  // ── Ignite: ボッ + whoosh ────────────────────────────────
  scheduleNoise(context, master, {
    start,
    duration: 0.28,
    gain: 0.46,
    frequency: 140,
    q: 0.55,
    type: 'lowpass',
  });
  scheduleTone(context, master, {
    start,
    duration: 0.22,
    frequency: 92,
    endFrequency: 42,
    gain: 0.24,
    type: 'triangle',
  });
  scheduleTone(context, master, {
    start: start + 0.02,
    duration: 0.16,
    frequency: 58,
    endFrequency: 32,
    gain: 0.2,
    type: 'sine',
  });
  scheduleNoise(context, master, {
    start: start + 0.04,
    duration: 0.2,
    gain: 0.18,
    frequency: 2400,
    q: 0.7,
    type: 'highpass',
    pan: -0.35,
  });
  scheduleNoise(context, master, {
    start: start + 0.07,
    duration: 0.12,
    gain: 0.22,
    frequency: 1900,
    q: 7,
    type: 'bandpass',
    pan: 0.4,
  });

  // ── Burning: roar + stereo パチパチ ──────────────────────
  scheduleNoise(context, master, {
    start: start + IGNITE_S,
    duration: BURNING_S - IGNITE_S,
    gain: 0.14,
    frequency: 180,
    q: 0.45,
    type: 'lowpass',
  });
  scheduleTone(context, master, {
    start: start + IGNITE_S,
    duration: BURNING_S - IGNITE_S + 0.08,
    frequency: 52,
    endFrequency: 38,
    gain: 0.1,
    type: 'triangle',
    attack: 0.08,
  });

  crackleOffsets(0.16, IGNITE_S, 0.09).forEach((offset, index) => {
    scheduleNoise(context, master, {
      start: start + offset,
      duration: 0.055 + (index % 3) * 0.008,
      gain: 0.2 - index * 0.018,
      frequency: 1700 + index * 220,
      q: 6.5,
      type: 'bandpass',
      pan: index % 2 === 0 ? -0.45 : 0.42,
    });
  });

  crackleOffsets(IGNITE_S + 0.04, BURNING_S - 0.04, 0.11).forEach((offset, index) => {
    scheduleNoise(context, master, {
      start: start + offset,
      duration: 0.06 + (index % 4) * 0.006,
      gain: 0.17 - (index % 5) * 0.012,
      frequency: 1500 + (index % 6) * 280,
      q: 6,
      type: 'bandpass',
      pan: index % 2 === 0 ? -0.55 : 0.5,
    });
  });

  // ── Carbonizing: サァ, crackle thins out ───────────────────
  scheduleNoise(context, master, {
    start: start + BURNING_S,
    duration: CARBONIZING_S - BURNING_S + 0.18,
    gain: 0.11,
    frequency: 760,
    q: 0.4,
    type: 'highpass',
  });
  scheduleTone(context, master, {
    start: start + BURNING_S,
    duration: 0.42,
    frequency: 70,
    endFrequency: 36,
    gain: 0.08,
    type: 'sine',
    attack: 0.05,
  });
  [0.08, 0.22, 0.38].forEach((offset, index) => {
    scheduleNoise(context, master, {
      start: start + BURNING_S + offset,
      duration: 0.07,
      gain: 0.1 - index * 0.02,
      frequency: 1200 + index * 180,
      q: 5,
      type: 'bandpass',
      pan: index === 1 ? 0.3 : -0.25,
    });
  });

  // ── Complete: 解放の和音 ────────────────────────────────
  const reward = start + CARBONIZING_S;
  scheduleTone(context, master, {
    start: reward,
    duration: 0.28,
    frequency: 523.25,
    endFrequency: 659.25,
    gain: 0.09,
    type: 'sine',
  });
  scheduleTone(context, master, {
    start: reward + 0.06,
    duration: 0.32,
    frequency: 659.25,
    endFrequency: 783.99,
    gain: 0.075,
    type: 'sine',
  });
  scheduleTone(context, master, {
    start: reward + 0.14,
    duration: 0.38,
    frequency: 783.99,
    endFrequency: 1046.5,
    gain: 0.07,
    type: 'sine',
  });
  scheduleTone(context, master, {
    start: reward + 0.22,
    duration: 0.42,
    frequency: 1046.5,
    endFrequency: 1318.5,
    gain: 0.05,
    type: 'sine',
  });
  scheduleNoise(context, master, {
    start: reward,
    duration: 0.2,
    gain: 0.08,
    frequency: 2600,
    q: 0.6,
    type: 'highpass',
  });
};

const playEtherealLayers = (context: AudioContext, master: AudioNode, start: number) => {
  scheduleTone(context, master, { start, duration: 0.7, frequency: 1200, endFrequency: 1860, gain: 0.055, type: 'sine', attack: 0.08 });
  scheduleTone(context, master, { start: start + 0.12, duration: 0.62, frequency: 800, endFrequency: 1480, gain: 0.04, type: 'sine', attack: 0.1 });
  scheduleTone(context, master, { start: start + CARBONIZING_S, duration: 0.5, frequency: 1760, endFrequency: 2480, gain: 0.05, type: 'sine' });
};

const playGoldenLayers = (context: AudioContext, master: AudioNode, start: number) => {
  const reward = start + CARBONIZING_S;
  scheduleTone(context, master, { start: reward, duration: 0.34, frequency: 880, endFrequency: 1320, gain: 0.09, type: 'sine' });
  scheduleTone(context, master, { start: reward + 0.1, duration: 0.36, frequency: 1100, endFrequency: 1760, gain: 0.07, type: 'sine' });
  scheduleTone(context, master, { start: reward + 0.2, duration: 0.4, frequency: 1320, endFrequency: 1980, gain: 0.06, type: 'sine' });
};

const playExplosiveLayers = (context: AudioContext, master: AudioNode, start: number) => {
  scheduleNoise(context, master, { start, duration: 0.34, gain: 0.62, frequency: 72, q: 0.45, type: 'lowpass' });
  scheduleTone(context, master, { start, duration: 0.28, frequency: 48, endFrequency: 26, gain: 0.3, type: 'triangle' });
  [0.05, 0.12, 0.2, 0.3, 0.42].forEach((offset, i) => {
    scheduleNoise(context, master, {
      start: start + offset,
      duration: 0.08,
      gain: 0.3 - i * 0.035,
      frequency: 1400 + i * 220,
      q: 7,
      type: 'bandpass',
      pan: i % 2 === 0 ? -0.6 : 0.58,
    });
  });
};

const playDragonLayers = (context: AudioContext, master: AudioNode, start: number) => {
  scheduleTone(context, master, { start, duration: 0.55, frequency: 40, endFrequency: 24, gain: 0.26, type: 'sawtooth', attack: 0.04 });
  scheduleTone(context, master, { start: start + IGNITE_S, duration: 0.9, frequency: 36, endFrequency: 28, gain: 0.12, type: 'sawtooth', attack: 0.1 });
  scheduleTone(context, master, { start: start + CARBONIZING_S, duration: 0.34, frequency: 770, endFrequency: 1320, gain: 0.08, type: 'sine' });
};

const playSoftLayers = (context: AudioContext, master: AudioNode, start: number) => {
  scheduleTone(context, master, { start: start + CARBONIZING_S, duration: 0.3, frequency: 1047, endFrequency: 1568, gain: 0.055, type: 'sine' });
  scheduleTone(context, master, { start: start + CARBONIZING_S + 0.1, duration: 0.34, frequency: 1175, endFrequency: 1976, gain: 0.04, type: 'sine' });
};

const playMetallicLayers = (context: AudioContext, master: AudioNode, start: number) => {
  scheduleTone(context, master, { start: start + 0.08, duration: 0.5, frequency: 1480, endFrequency: 2220, gain: 0.06, type: 'sine' });
  scheduleTone(context, master, { start: start + CARBONIZING_S, duration: 0.42, frequency: 1760, endFrequency: 2640, gain: 0.06, type: 'sine' });
};

const playVoidLayers = (context: AudioContext, master: AudioNode, start: number) => {
  scheduleTone(context, master, { start, duration: 0.8, frequency: 32, endFrequency: 18, gain: 0.2, type: 'sine', attack: 0.12 });
  scheduleTone(context, master, { start: start + CARBONIZING_S, duration: 0.5, frequency: 220, endFrequency: 330, gain: 0.05, type: 'sine', attack: 0.08 });
};

const playPhoenixLayers = (context: AudioContext, master: AudioNode, start: number) => {
  playExplosiveLayers(context, master, start);
  playGoldenLayers(context, master, start);
  scheduleTone(context, master, {
    start: start + CARBONIZING_S + 0.18,
    duration: 0.48,
    frequency: 1760,
    endFrequency: 2794,
    gain: 0.07,
    type: 'sine',
  });
};

const playWithProfile = async (decorate?: (context: AudioContext, master: AudioNode, start: number) => void) => {
  const context = await getAudioContext();
  if (!context) return false;

  const master = createMaster(context);
  const start = context.currentTime + 0.012;
  playCoreRitual(context, master, start);
  decorate?.(context, master, start);
  return true;
};

export const playFireSequence = async () => playWithProfile();

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

export const playSpectacleSequence = async (profile: BurnSpectacleSound) => {
  switch (profile) {
    case 'ethereal':
      return playWithProfile(playEtherealLayers);
    case 'golden':
      return playWithProfile(playGoldenLayers);
    case 'explosive':
      return playWithProfile(playExplosiveLayers);
    case 'dragon':
      return playWithProfile(playDragonLayers);
    case 'soft':
      return playWithProfile(playSoftLayers);
    case 'metallic':
      return playWithProfile(playMetallicLayers);
    case 'void':
      return playWithProfile(playVoidLayers);
    case 'phoenix':
      return playWithProfile(playPhoenixLayers);
    case 'normal':
    default:
      return playFireSequence();
  }
};
