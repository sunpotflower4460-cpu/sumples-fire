import { describe, expect, it, vi } from 'vitest';
import { createAmbientPlayer } from './ambientPlayer';
import type { AmbientLayerId, StereoLoop } from './ambientSynth';

type FakeNode = { connected: unknown[]; connect: (target: unknown) => void };

const createFakeContext = (initialState = 'suspended') => {
  const log = {
    sources: [] as { started: boolean; loop: boolean }[],
    gains: [] as { gain: { value: number; targets: number[] } }[],
    closed: false,
    resumed: false,
  };
  const ctx = {
    state: initialState as string,
    currentTime: 0,
    destination: {},
    onstatechange: null as (() => void) | null,
    resume: vi.fn(async () => {
      log.resumed = true;
      ctx.state = 'running';
    }),
    close: vi.fn(async () => {
      log.closed = true;
      ctx.state = 'closed';
    }),
    createGain: () => {
      const node = {
        connected: [] as unknown[],
        connect(target: unknown) {
          node.connected.push(target);
        },
        gain: {
          value: 1,
          targets: [] as number[],
          setTargetAtTime(value: number) {
            node.gain.targets.push(value);
          },
        },
      } satisfies FakeNode & { gain: unknown };
      log.gains.push(node as never);
      return node as unknown as GainNode;
    },
    createBuffer: (_channels: number, length: number) => ({
      length,
      copyToChannel: () => {},
    }) as unknown as AudioBuffer,
    createBufferSource: () => {
      const source = {
        buffer: null as unknown,
        loop: false,
        started: false,
        connect: () => {},
        start() {
          source.started = true;
        },
      };
      log.sources.push(source);
      return source as unknown as AudioBufferSourceNode;
    },
  };
  return { ctx: ctx as unknown as AudioContext & { state: string; onstatechange: (() => void) | null }, log };
};

const tinyLoop = (): StereoLoop => ({ left: new Float32Array(8), right: new Float32Array(8) });

const setup = (state?: string) => {
  const fake = createFakeContext(state);
  const rendered: AmbientLayerId[] = [];
  let pageStop: (() => void) | null = null;
  const unwatch = vi.fn();
  const timers: (() => void)[] = [];
  const player = createAmbientPlayer({
    createContext: () => fake.ctx,
    renderLayer: (layer) => {
      rendered.push(layer);
      return tinyLoop();
    },
    watchPage: (stop) => {
      pageStop = stop;
      return unwatch;
    },
    setTimeout: (fn) => {
      timers.push(fn);
      return 0;
    },
  });
  return {
    player,
    fake,
    rendered,
    unwatch,
    timers,
    pageStop: () => pageStop?.(),
  };
};

const mix = (fire = 0, rain = 0, wind = 0) => ({ fire, rain, wind });

describe('ambient player', () => {
  it('is silent by default: no audio context exists until start() is called', () => {
    const { player, fake } = setup();
    expect(player.getStatus()).toBe('stopped');
    expect(fake.ctx.resume).not.toHaveBeenCalled();
    expect(fake.log.sources).toHaveLength(0);
  });

  it('starts only when asked, and renders only the layers that are turned up', async () => {
    const { player, fake, rendered } = setup();
    expect(await player.start(mix(35, 0, 15))).toBe(true);
    expect(player.getStatus()).toBe('playing');
    expect(rendered.sort()).toEqual(['fire', 'wind']);
    expect(fake.log.sources.filter((s) => s.started && s.loop)).toHaveLength(2);
  });

  it('applies the slider volumes as gains and updates them live', async () => {
    const { player, fake } = setup();
    await player.start(mix(100, 0, 0));
    const fireGain = fake.log.gains.find((g) => g.gain.targets.length > 0)!;
    expect(fireGain.gain.targets[fireGain.gain.targets.length - 1]).toBeCloseTo(0.55, 5);

    player.setMix(mix(0, 0, 0));
    await Promise.resolve();
    expect(fireGain.gain.targets[fireGain.gain.targets.length - 1]).toBe(0);
  });

  it('turning a silent layer up while playing adds it without restarting', async () => {
    const { player, fake, rendered } = setup();
    await player.start(mix(20, 0, 0));
    expect(rendered).toEqual(['fire']);
    player.setMix(mix(20, 40, 0));
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(rendered).toEqual(['fire', 'rain']);
    expect(fake.ctx.resume).toHaveBeenCalledTimes(1);
  });

  it('a second start() while playing does not create a second context', async () => {
    const { player, fake } = setup();
    await player.start(mix(20));
    await player.start(mix(30));
    expect(fake.ctx.resume).toHaveBeenCalledTimes(1);
  });

  it('stop() ends playback, releases the page watchers and closes the context', async () => {
    const { player, fake, unwatch, timers } = setup();
    await player.start(mix(20));
    player.stop();
    expect(player.getStatus()).toBe('stopped');
    expect(unwatch).toHaveBeenCalledTimes(1);
    timers.forEach((run) => run());
    expect(fake.ctx.close).toHaveBeenCalledTimes(1);
    expect(fake.log.closed).toBe(true);
  });

  it('stop() is safe when nothing is playing', () => {
    const { player } = setup();
    expect(() => player.stop()).not.toThrow();
    expect(player.getStatus()).toBe('stopped');
  });

  it('leaving the page (hidden / pagehide) stops it, and it does not come back by itself', async () => {
    const { player, pageStop, fake } = setup();
    await player.start(mix(20));
    pageStop();
    expect(player.getStatus()).toBe('stopped');
    // …and nothing re-opens a context afterwards
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(player.getStatus()).toBe('stopped');
    expect(fake.ctx.resume).toHaveBeenCalledTimes(1);
  });

  it('an OS interruption (state leaves "running") stops it and is never resumed', async () => {
    const { player, fake } = setup();
    await player.start(mix(20));
    fake.ctx.state = 'interrupted';
    fake.ctx.onstatechange?.();
    expect(player.getStatus()).toBe('stopped');
    fake.ctx.state = 'running';
    fake.ctx.onstatechange?.();
    expect(player.getStatus()).toBe('stopped');
  });

  it('stopping while it is still starting aborts cleanly: no layer starts afterwards', async () => {
    const { player, fake } = setup();
    const pending = player.start(mix(20, 20, 20));
    player.stop();
    expect(await pending).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(fake.log.sources.filter((s) => s.started)).toHaveLength(0);
    expect(player.getStatus()).toBe('stopped');
  });

  it('fails quietly when audio is unavailable', async () => {
    const player = createAmbientPlayer({ createContext: () => null });
    expect(await player.start(mix(20))).toBe(false);
    expect(player.getStatus()).toBe('stopped');
  });

  it('fails quietly when the context cannot resume (e.g. blocked)', async () => {
    const fake = createFakeContext();
    fake.ctx.resume = vi.fn(async () => {
      throw new Error('NotAllowedError');
    });
    const player = createAmbientPlayer({ createContext: () => fake.ctx, setTimeout: () => 0, watchPage: () => () => {} });
    expect(await player.start(mix(20))).toBe(false);
    expect(player.getStatus()).toBe('stopped');
  });

  it('can be played again only by an explicit start()', async () => {
    const first = createFakeContext();
    const second = createFakeContext();
    const contexts = [first.ctx, second.ctx];
    const player = createAmbientPlayer({
      createContext: () => contexts.shift() ?? null,
      renderLayer: () => tinyLoop(),
      watchPage: () => () => {},
      setTimeout: () => 0,
    });
    await player.start(mix(20));
    player.stop();
    expect(player.getStatus()).toBe('stopped');
    expect(await player.start(mix(20))).toBe(true);
    expect(second.ctx.resume).toHaveBeenCalledTimes(1);
  });

  it('notifies subscribers of status changes', async () => {
    const { player } = setup();
    const seen: string[] = [];
    player.subscribe(() => seen.push(player.getStatus()));
    await player.start(mix(20));
    player.stop();
    expect(seen).toEqual(['starting', 'playing', 'stopped']);
  });
});
