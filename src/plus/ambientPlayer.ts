import { AMBIENT_LAYERS, AMBIENT_SAMPLE_RATE, renderAmbientLayer, volumeToGain } from './ambientSynth';
import type { AmbientLayerId, StereoLoop } from './ambientSynth';
import type { AmbientMix } from './plusPreferences';

export type AmbientStatus = 'stopped' | 'starting' | 'playing';


export type AmbientDeps = {
  createContext: () => AudioContext | null;
  renderLayer: (layer: AmbientLayerId) => StereoLoop;
  /** Subscribes to "the page went away" signals; returns an unsubscribe. */
  watchPage: (stop: () => void) => () => void;
  setTimeout: (fn: () => void, ms: number) => unknown;
};

const defaultCreateContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    return new Ctor();
  } catch {
    return null;
  }
};

/**
 * Anything that means "the person is no longer looking at this" stops the sound
 * for good: the page hidden (home, app switch, screen lock) or leaving it. There
 * is deliberately no resume — it only plays again when they press the button.
 */
const defaultWatchPage = (stop: () => void) => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return () => {};
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') stop();
  };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', stop);
  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', stop);
  };
};

/** Let the UI paint between layers so starting never freezes the screen. */
const yieldToUi = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/**
 * The Plus ambient sound player (火の音 / 雨だれ / 夜の風).
 *
 * Contract (docs/plus/DESIGN.md §4.2):
 *  - silent until `start()` is called from a button press
 *  - plays only while the Plus scene screens are shown; every exit path calls
 *    `stop()`: leaving the screen, the app going to the background, the screen
 *    locking, and OS audio interruptions (calls, Siri, other apps)
 *  - never resumes by itself, and nothing about "playing" is ever persisted
 *  - one AudioContext per play session, closed on stop, so nothing lingers
 */
export const createAmbientPlayer = (overrides: Partial<AmbientDeps> = {}) => {
  const deps: AmbientDeps = {
    createContext: defaultCreateContext,
    renderLayer: (layer) => renderAmbientLayer(layer),
    watchPage: defaultWatchPage,
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    ...overrides,
  };

  let status: AmbientStatus = 'stopped';
  let generation = 0;
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let mix: AmbientMix = { fire: 0, rain: 0, wind: 0 };
  let unwatch: (() => void) | null = null;
  const layers = new Map<AmbientLayerId, GainNode>();
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((listener) => listener());
  const setStatus = (next: AmbientStatus) => {
    if (status === next) return;
    status = next;
    emit();
  };

  const applyGains = () => {
    if (!context) return;
    layers.forEach((gain, layer) => {
      gain.gain.setTargetAtTime(volumeToGain(layer, mix[layer]), context!.currentTime, 0.05);
    });
  };

  const ensureLayer = async (layer: AmbientLayerId, token: number) => {
    if (layers.has(layer) || !context) return;
    await yieldToUi();
    if (token !== generation || !context) return;

    const loop = deps.renderLayer(layer);
    if (token !== generation || !context) return;

    const buffer = context.createBuffer(2, loop.left.length, AMBIENT_SAMPLE_RATE);
    buffer.copyToChannel(loop.left, 0);
    buffer.copyToChannel(loop.right, 1);

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = context.createGain();
    gain.gain.value = 0;
    source.connect(gain);
    gain.connect(master!);
    source.start();
    layers.set(layer, gain);
  };

  const syncLayers = async (token: number) => {
    for (const layer of AMBIENT_LAYERS) {
      if (mix[layer] > 0) await ensureLayer(layer, token);
      if (token !== generation) return;
    }
    applyGains();
  };

  const stop = () => {
    if (status === 'stopped') return;
    generation += 1;

    const closing = context;
    const fading = master;
    context = null;
    master = null;
    layers.clear();
    unwatch?.();
    unwatch = null;
    setStatus('stopped');

    if (closing) {
      closing.onstatechange = null;
      try {
        fading?.gain.setTargetAtTime(0, closing.currentTime, 0.03);
      } catch {
        // already closing
      }
      deps.setTimeout(() => {
        void closing.close().catch(() => {});
      }, 180);
    }
  };

  /** Begin playing. Must be called from a user gesture (iOS requires it). */
  const start = async (nextMix: AmbientMix): Promise<boolean> => {
    mix = nextMix;
    if (status !== 'stopped') {
      await syncLayers(generation);
      return status === 'playing';
    }

    generation += 1;
    const token = generation;
    setStatus('starting');

    const created = deps.createContext();
    if (!created) {
      setStatus('stopped');
      return false;
    }
    context = created;

    // Mix with, and never interrupt, music or podcasts the person already has on.
    try {
      const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
      if (session) session.type = 'ambient';
    } catch {
      // not supported — default behaviour is fine
    }

    master = created.createGain();
    master.gain.value = 1;
    master.connect(created.destination);

    // An OS interruption (call, Siri, another app taking audio) ends playback; it
    // is never resumed behind the person's back.
    created.onstatechange = () => {
      if (token === generation && created.state !== 'running') stop();
    };

    try {
      await created.resume();
    } catch {
      if (token === generation) stop();
      return false;
    }
    if (token !== generation) return false;
    if (created.state !== 'running') {
      stop();
      return false;
    }

    unwatch = deps.watchPage(stop);

    await syncLayers(token);
    if (token !== generation) return false;

    setStatus('playing');
    return true;
  };

  const setMix = (nextMix: AmbientMix) => {
    mix = nextMix;
    if (status === 'stopped') return;
    void syncLayers(generation);
  };

  return {
    start,
    stop,
    setMix,
    getStatus: () => status,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};

export type AmbientPlayer = ReturnType<typeof createAmbientPlayer>;

/** The one player the app uses. Nothing runs until `start()` is called. */
export const ambientPlayer: AmbientPlayer = createAmbientPlayer();

