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
