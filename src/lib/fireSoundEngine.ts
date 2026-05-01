type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let audioContext: AudioContext | null = null;
let crackleBuffer: AudioBuffer | null = null;

const getAudioContext = async () => {
  if (typeof window === 'undefined') return null;

  const AudioContextConstructor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!AudioContextConstructor) return null;

  if (!audioContext) {
    audioContext = new AudioContextConstructor();
  }

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  return audioContext;
};

const createNoiseBuffer = (context: AudioContext) => {
  const length = Math.floor(context.sampleRate * 1.4);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {
    const decay = 1 - i / length;
    const sparseCrackle = Math.random() > 0.965 ? Math.random() * 2 - 1 : 0;
    const softNoise = (Math.random() * 2 - 1) * 0.08;
    data[i] = (sparseCrackle + softNoise) * decay;
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
  gain.gain.exponentialRampToValueAtTime(options.gain, options.start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, options.start + options.duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  source.start(options.start);
  source.stop(options.start + options.duration + 0.05);
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
  },
) => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = options.type ?? 'sine';
  oscillator.frequency.setValueAtTime(options.frequency, options.start);
  if (options.endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(options.endFrequency, options.start + options.duration);
  }

  gain.gain.setValueAtTime(0.0001, options.start);
  gain.gain.exponentialRampToValueAtTime(options.gain, options.start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, options.start + options.duration);

  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(options.start);
  oscillator.stop(options.start + options.duration + 0.04);
};

const createMaster = (context: AudioContext) => {
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-18, context.currentTime);
  compressor.knee.setValueAtTime(18, context.currentTime);
  compressor.ratio.setValueAtTime(4, context.currentTime);
  compressor.attack.setValueAtTime(0.004, context.currentTime);
  compressor.release.setValueAtTime(0.18, context.currentTime);

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.72, context.currentTime);

  compressor.connect(gain);
  gain.connect(context.destination);

  return compressor;
};

export const playFireSequence = async () => {
  const context = await getAudioContext();
  if (!context) return false;

  const master = createMaster(context);
  const start = context.currentTime + 0.01;

  // Ignite: ボッ
  scheduleNoise(context, master, {
    start,
    duration: 0.22,
    gain: 0.34,
    frequency: 170,
    q: 0.7,
    type: 'lowpass',
  });
  scheduleTone(context, master, {
    start,
    duration: 0.18,
    frequency: 82,
    endFrequency: 48,
    gain: 0.18,
    type: 'triangle',
  });

  // Crackle: パチ、パチパチ
  [0.19, 0.31, 0.43, 0.57, 0.69].forEach((offset, index) => {
    scheduleNoise(context, master, {
      start: start + offset,
      duration: 0.07 + index * 0.006,
      gain: 0.18 - index * 0.018,
      frequency: 1800 + index * 260,
      q: 6,
      type: 'bandpass',
    });
  });

  // Ash: サァ
  scheduleNoise(context, master, {
    start: start + 0.55,
    duration: 0.55,
    gain: 0.1,
    frequency: 820,
    q: 0.45,
    type: 'highpass',
  });

  // Reward: キン
  scheduleTone(context, master, {
    start: start + 0.82,
    duration: 0.18,
    frequency: 880,
    endFrequency: 1320,
    gain: 0.075,
    type: 'sine',
  });
  scheduleTone(context, master, {
    start: start + 0.88,
    duration: 0.24,
    frequency: 1320,
    endFrequency: 1760,
    gain: 0.05,
    type: 'sine',
  });

  return true;
};

export const warmUpFireSound = async () => {
  const context = await getAudioContext();
  return Boolean(context);
};

// ── Spectacle-specific sound sequences ──

const playEtherealSequence = (context: AudioContext, master: AudioNode, start: number) => {
  // 鬼火: high-frequency tones, breathy, minimal crackle
  scheduleTone(context, master, { start, duration: 0.55, frequency: 1200, endFrequency: 1800, gain: 0.06, type: 'sine' });
  scheduleTone(context, master, { start: start + 0.1, duration: 0.5, frequency: 800, endFrequency: 1200, gain: 0.04, type: 'sine' });
  scheduleNoise(context, master, { start, duration: 0.4, gain: 0.06, frequency: 3000, q: 0.3, type: 'highpass' });
  scheduleTone(context, master, { start: start + 0.55, duration: 0.4, frequency: 2200, endFrequency: 3300, gain: 0.04, type: 'sine' });
  scheduleTone(context, master, { start: start + 0.85, duration: 0.3, frequency: 1760, endFrequency: 2200, gain: 0.05, type: 'sine' });
};

const playGoldenSequence = (context: AudioContext, master: AudioNode, start: number) => {
  // 黄金: melodic, harmonious, bright reward
  scheduleTone(context, master, { start, duration: 0.22, frequency: 110, endFrequency: 66, gain: 0.14, type: 'triangle' });
  scheduleNoise(context, master, { start, duration: 0.18, gain: 0.22, frequency: 150, q: 0.7, type: 'lowpass' });
  [0.22, 0.38, 0.52].forEach((offset, i) => {
    scheduleNoise(context, master, { start: start + offset, duration: 0.07, gain: 0.12 - i * 0.02, frequency: 2000 + i * 300, q: 5, type: 'bandpass' });
  });
  scheduleTone(context, master, { start: start + 0.75, duration: 0.28, frequency: 880, endFrequency: 1320, gain: 0.08, type: 'sine' });
  scheduleTone(context, master, { start: start + 0.88, duration: 0.28, frequency: 1100, endFrequency: 1650, gain: 0.07, type: 'sine' });
  scheduleTone(context, master, { start: start + 1.0, duration: 0.32, frequency: 1320, endFrequency: 1980, gain: 0.06, type: 'sine' });
};

const playExplosiveSequence = (context: AudioContext, master: AudioNode, start: number) => {
  // 爆炎: bass-heavy burst then resonance
  scheduleNoise(context, master, { start, duration: 0.3, gain: 0.55, frequency: 80, q: 0.5, type: 'lowpass' });
  scheduleTone(context, master, { start, duration: 0.25, frequency: 55, endFrequency: 30, gain: 0.28, type: 'triangle' });
  [0.06, 0.14, 0.22, 0.30, 0.38, 0.50].forEach((offset, i) => {
    scheduleNoise(context, master, { start: start + offset, duration: 0.08, gain: 0.28 - i * 0.03, frequency: 1500 + i * 200, q: 7, type: 'bandpass' });
  });
  scheduleNoise(context, master, { start: start + 0.5, duration: 0.6, gain: 0.1, frequency: 600, q: 0.4, type: 'highpass' });
  scheduleTone(context, master, { start: start + 0.85, duration: 0.3, frequency: 660, endFrequency: 1100, gain: 0.08, type: 'sine' });
};

const playDragonSequence = (context: AudioContext, master: AudioNode, start: number) => {
  // 龍の炎: deep growl, rising power
  scheduleTone(context, master, { start, duration: 0.35, frequency: 44, endFrequency: 28, gain: 0.25, type: 'sawtooth' });
  scheduleNoise(context, master, { start, duration: 0.28, gain: 0.4, frequency: 120, q: 0.6, type: 'lowpass' });
  [0.12, 0.26, 0.40, 0.56, 0.70].forEach((offset, i) => {
    scheduleNoise(context, master, { start: start + offset, duration: 0.08 + i * 0.004, gain: 0.22 - i * 0.025, frequency: 1200 + i * 240, q: 6, type: 'bandpass' });
  });
  scheduleNoise(context, master, { start: start + 0.6, duration: 0.65, gain: 0.12, frequency: 900, q: 0.45, type: 'highpass' });
  scheduleTone(context, master, { start: start + 0.9, duration: 0.22, frequency: 770, endFrequency: 1155, gain: 0.08, type: 'sine' });
  scheduleTone(context, master, { start: start + 0.98, duration: 0.3, frequency: 1155, endFrequency: 1760, gain: 0.07, type: 'sine' });
};

const playSoftSequence = (context: AudioContext, master: AudioNode, start: number) => {
  // 桜の火: soft, delicate, gentle
  scheduleNoise(context, master, { start, duration: 0.16, gain: 0.2, frequency: 140, q: 0.7, type: 'lowpass' });
  scheduleTone(context, master, { start, duration: 0.14, frequency: 70, endFrequency: 44, gain: 0.12, type: 'triangle' });
  [0.16, 0.28, 0.40].forEach((offset, i) => {
    scheduleNoise(context, master, { start: start + offset, duration: 0.06, gain: 0.11 - i * 0.015, frequency: 1600 + i * 220, q: 5, type: 'bandpass' });
  });
  scheduleNoise(context, master, { start: start + 0.5, duration: 0.45, gain: 0.07, frequency: 700, q: 0.42, type: 'highpass' });
  scheduleTone(context, master, { start: start + 0.72, duration: 0.2, frequency: 1047, endFrequency: 1568, gain: 0.055, type: 'sine' });
  scheduleTone(context, master, { start: start + 0.84, duration: 0.24, frequency: 1175, endFrequency: 1760, gain: 0.04, type: 'sine' });
};

const playMetallicSequence = (context: AudioContext, master: AudioNode, start: number) => {
  // 鉄の火: metallic ring, sharp, precise
  scheduleNoise(context, master, { start, duration: 0.2, gain: 0.3, frequency: 160, q: 0.6, type: 'lowpass' });
  scheduleTone(context, master, { start, duration: 0.16, frequency: 88, endFrequency: 52, gain: 0.16, type: 'triangle' });
  [0.18, 0.3, 0.42, 0.56, 0.68].forEach((offset, i) => {
    scheduleNoise(context, master, { start: start + offset, duration: 0.065, gain: 0.2 - i * 0.02, frequency: 1900 + i * 280, q: 8, type: 'bandpass' });
  });
  scheduleTone(context, master, { start: start + 0.8, duration: 0.4, frequency: 1480, endFrequency: 2220, gain: 0.07, type: 'sine' });
  scheduleTone(context, master, { start: start + 0.9, duration: 0.35, frequency: 1760, endFrequency: 2640, gain: 0.055, type: 'sine' });
};

const playVoidSequence = (context: AudioContext, master: AudioNode, start: number) => {
  // 虚空: deep sub-bass, minimal, eerie
  scheduleTone(context, master, { start, duration: 0.5, frequency: 36, endFrequency: 20, gain: 0.22, type: 'sine' });
  scheduleNoise(context, master, { start, duration: 0.35, gain: 0.18, frequency: 90, q: 0.5, type: 'lowpass' });
  [0.2, 0.38, 0.55].forEach((offset, i) => {
    scheduleNoise(context, master, { start: start + offset, duration: 0.07, gain: 0.1 - i * 0.02, frequency: 1000 + i * 180, q: 5, type: 'bandpass' });
  });
  scheduleNoise(context, master, { start: start + 0.6, duration: 0.7, gain: 0.07, frequency: 500, q: 0.35, type: 'highpass' });
  scheduleTone(context, master, { start: start + 0.9, duration: 0.35, frequency: 440, endFrequency: 660, gain: 0.055, type: 'sine' });
  scheduleTone(context, master, { start: start + 1.0, duration: 0.4, frequency: 550, endFrequency: 825, gain: 0.045, type: 'sine' });
};

const playPhoenixSequence = (context: AudioContext, master: AudioNode, start: number) => {
  // フェニックス: full, triumphant, layered
  scheduleNoise(context, master, { start, duration: 0.32, gain: 0.45, frequency: 160, q: 0.65, type: 'lowpass' });
  scheduleTone(context, master, { start, duration: 0.28, frequency: 88, endFrequency: 52, gain: 0.22, type: 'triangle' });
  [0.08, 0.18, 0.28, 0.40, 0.54, 0.68, 0.82].forEach((offset, i) => {
    scheduleNoise(context, master, { start: start + offset, duration: 0.07 + i * 0.004, gain: 0.24 - i * 0.02, frequency: 1600 + i * 260, q: 6, type: 'bandpass' });
  });
  scheduleNoise(context, master, { start: start + 0.6, duration: 0.65, gain: 0.12, frequency: 800, q: 0.45, type: 'highpass' });
  scheduleTone(context, master, { start: start + 0.85, duration: 0.22, frequency: 880, endFrequency: 1320, gain: 0.09, type: 'sine' });
  scheduleTone(context, master, { start: start + 0.93, duration: 0.28, frequency: 1100, endFrequency: 1650, gain: 0.08, type: 'sine' });
  scheduleTone(context, master, { start: start + 1.02, duration: 0.32, frequency: 1320, endFrequency: 1980, gain: 0.07, type: 'sine' });
  scheduleTone(context, master, { start: start + 1.12, duration: 0.36, frequency: 1760, endFrequency: 2640, gain: 0.06, type: 'sine' });
};

import type { BurnSpectacleSound } from './fireBurnSpectacle';

export const playSpectacleSequence = async (profile: BurnSpectacleSound) => {
  if (profile === 'normal') return playFireSequence();

  const context = await getAudioContext();
  if (!context) return false;

  const master = createMaster(context);
  const start = context.currentTime + 0.01;

  switch (profile) {
    case 'ethereal':  playEtherealSequence(context, master, start);  break;
    case 'golden':    playGoldenSequence(context, master, start);    break;
    case 'explosive': playExplosiveSequence(context, master, start); break;
    case 'dragon':    playDragonSequence(context, master, start);    break;
    case 'soft':      playSoftSequence(context, master, start);      break;
    case 'metallic':  playMetallicSequence(context, master, start);  break;
    case 'void':      playVoidSequence(context, master, start);      break;
    case 'phoenix':   playPhoenixSequence(context, master, start);   break;
    default:          break;
  }

  return true;
};
