import { describe, expect, it, vi } from 'vitest';
import { createPlusStore } from './plusStore';
import type { PlusPurchaseService } from './purchaseService';
import { DEFAULT_PLUS_PREFERENCES, parsePlusPreferences } from './plusPreferences';
import type { PlusPreferences } from './plusPreferences';
import type { EntitlementCheck, PurchaseOutcome, RestoreOutcome } from './storeState';

type FakeOptions = {
  entitlement?: EntitlementCheck;
  purchase?: PurchaseOutcome;
  restore?: RestoreOutcome;
  product?: 'ready' | 'unavailable' | 'restricted';
};

const createFakeService = (options: FakeOptions = {}) => {
  let listener: ((update: 'granted' | 'revoked') => void) | null = null;
  const calls: string[] = [];
  const service: PlusPurchaseService & { emit: (u: 'granted' | 'revoked') => void; calls: string[] } = {
    kind: 'mock',
    calls,
    emit: (update) => listener?.(update),
    loadProduct: async () => {
      calls.push('loadProduct');
      const product = options.product ?? 'ready';
      return product === 'ready' ? { status: 'ready', displayPrice: '¥800' } : { status: product };
    },
    checkEntitlement: async () => {
      calls.push('checkEntitlement');
      return options.entitlement ?? 'notEntitled';
    },
    purchase: async () => {
      calls.push('purchase');
      await Promise.resolve();
      return options.purchase ?? 'success';
    },
    restore: async () => {
      calls.push('restore');
      return options.restore ?? 'nothing';
    },
    subscribe: (cb) => {
      listener = cb;
      return () => {
        listener = null;
      };
    },
  };
  return service;
};

const createStore = (initial: string | null = null, writeOk = true) => {
  let stored = initial;
  const writes: string[] = [];
  const store = createPlusStore({
    readPreferences: () => stored,
    writePreferences: async (value) => {
      writes.push(value);
      if (!writeOk) return false;
      stored = value;
      return true;
    },
    createService: async () => createFakeService(),
  });
  return { store, writes, getStored: () => stored };
};

const favorites = (extra: Partial<PlusPreferences> = {}): PlusPreferences => ({
  ...DEFAULT_PLUS_PREFERENCES,
  flameMode: 'favorites',
  favoriteFlames: ['cherry', 'golden'],
  ...extra,
});

describe('plusStore — startup', () => {
  it('loads the price and entitlement without blocking and starts "checking"', async () => {
    const { store } = createStore();
    expect(store.getState().store.entitlement).toBe('checking');
    await store.init(createFakeService({ entitlement: 'entitled' }));
    expect(store.getState().store.entitlement).toBe('entitled');
    expect(store.getState().store.product).toEqual({ status: 'ready', displayPrice: '¥800' });
  });

  it('init is idempotent', async () => {
    const { store } = createStore();
    const service = createFakeService();
    await store.init(service);
    await store.init(service);
    expect(service.calls.filter((call) => call === 'checkEntitlement')).toHaveLength(1);
  });

  it('hydrates saved preferences, and falls back to おまかせ for corrupt data', () => {
    const good = createStore(JSON.stringify({ ...favorites(), version: 1 }));
    good.store.hydrate();
    expect(good.store.getState().preferences.flameMode).toBe('favorites');

    const bad = createStore('{not json');
    bad.store.hydrate();
    expect(bad.store.getState().preferences.flameMode).toBe('auto');
  });
});

describe('plusStore — purchase flows', () => {
  it('a double tap on buy performs exactly one purchase', async () => {
    const { store } = createStore();
    const service = createFakeService();
    await store.init(service);
    await Promise.all([store.purchase(), store.purchase()]);
    expect(service.calls.filter((call) => call === 'purchase')).toHaveLength(1);
    expect(store.getState().store.entitlement).toBe('entitled');
  });

  it('cancel leaves everything as it was and shows no error', async () => {
    const { store } = createStore();
    await store.init(createFakeService({ purchase: 'cancelled' }));
    await store.purchase();
    const { store: state } = store.getState();
    expect(state.entitlement).toBe('notEntitled');
    expect(state.purchase).toBe('idle');
  });

  it('pending → later success arrives through updates and unlocks without a tap', async () => {
    const { store } = createStore();
    const service = createFakeService({ purchase: 'pending' });
    await store.init(service);
    await store.purchase();
    expect(store.getState().store.purchase).toBe('pending');

    service.emit('granted');
    expect(store.getState().store.entitlement).toBe('entitled');
    expect(store.getState().store.purchase).toBe('idle');
  });

  it('"check purchase status" finds a pending purchase that completed', async () => {
    const { store } = createStore();
    let entitlement: EntitlementCheck = 'notEntitled';
    const service = { ...createFakeService({ purchase: 'pending' }), checkEntitlement: async () => entitlement };
    await store.init(service);
    await store.purchase();
    entitlement = 'entitled';
    await store.recheckEntitlement();
    expect(store.getState().store.entitlement).toBe('entitled');
  });

  it.each([
    { update: 'granted', initial: 'notEntitled', expected: 'entitled' },
    { update: 'revoked', initial: 'entitled', expected: 'notEntitled' },
  ] as const)('keeps a verified $update when an older entitlement check returns', async ({ update, initial, expected }) => {
    const { store } = createStore();
    const service = createFakeService({ entitlement: initial });
    await store.init(service);

    let completeCheck!: (result: EntitlementCheck) => void;
    service.checkEntitlement = () => new Promise((resolve) => { completeCheck = resolve; });
    const checking = store.recheckEntitlement();
    service.emit(update);
    completeCheck(initial);

    await checking;
    expect(store.getState().store.entitlement).toBe(expected);
  });

  it('does not start a restore while the Apple purchase sheet is open', async () => {
    const { store } = createStore();
    const service = createFakeService();
    await store.init(service);

    let completePurchase!: (result: PurchaseOutcome) => void;
    service.purchase = () => new Promise((resolve) => { completePurchase = resolve; });
    const purchasing = store.purchase();
    service.emit('granted');
    expect(store.getState().store.purchase).toBe('purchasing');
    await store.restore();
    expect(service.calls).not.toContain('restore');
    completePurchase('cancelled');
    await purchasing;

    await store.restore();
    expect(service.calls).toContain('restore');
  });

  it('an unverified purchase does not unlock', async () => {
    const { store } = createStore();
    await store.init(createFakeService({ purchase: 'unverified' }));
    await store.purchase();
    expect(store.getState().store.entitlement).toBe('notEntitled');
    expect(store.getState().store.purchase).toBe('unverified');
  });

  it('restore: found / nothing / unreachable are distinguished', async () => {
    for (const [outcome, entitlement, restore] of [
      ['restored', 'entitled', 'restored'],
      ['nothing', 'notEntitled', 'nothing'],
      ['unavailable', 'notEntitled', 'unavailable'],
    ] as const) {
      const { store } = createStore();
      await store.init(createFakeService({ restore: outcome }));
      await store.restore();
      expect(store.getState().store.entitlement).toBe(entitlement);
      expect(store.getState().store.restore).toBe(restore);
    }
  });

  it.each([
    { response: 'nothing', initial: 'notEntitled', update: 'granted', check: 'entitled', entitlement: 'entitled', restore: 'restored' },
    { response: 'restored', initial: 'entitled', update: 'revoked', check: 'unknown', entitlement: 'notEntitled', restore: 'nothing' },
  ] as const)('reconciles a $response restore response with a verified $update', async ({ response, initial, update, check, entitlement, restore }) => {
    const { store } = createStore();
    const service = createFakeService({ entitlement: initial });
    await store.init(service);

    let completeRestore!: (result: RestoreOutcome) => void;
    service.restore = () => new Promise((resolve) => { completeRestore = resolve; });
    const restoring = store.restore();
    service.checkEntitlement = async () => check;
    service.emit(update);
    completeRestore(response);

    await restoring;
    expect(store.getState().store).toMatchObject({ entitlement, restore });
  });

  it.each(['entitled', 'notEntitled'] as const)('rechecks a purchase success that races with a revocation: %s', async (entitlement) => {
    const { store } = createStore();
    const service = createFakeService();
    await store.init(service);

    let completePurchase!: (result: PurchaseOutcome) => void;
    service.purchase = () => new Promise((resolve) => { completePurchase = resolve; });
    const purchasing = store.purchase();
    service.checkEntitlement = vi.fn(async () => entitlement);
    service.emit('revoked');
    completePurchase('success');

    await purchasing;
    expect(service.checkEntitlement).toHaveBeenCalledOnce();
    expect(store.getState().store).toMatchObject({ entitlement, justPurchased: entitlement === 'entitled' });
  });

  it('a refund arriving later locks the extras but keeps saved preferences for a future restore', async () => {
    const saved = JSON.stringify({ ...favorites(), version: 1 });
    const { store } = createStore(saved);
    store.hydrate();
    const service = createFakeService({ entitlement: 'entitled' });
    await store.init(service);
    service.emit('revoked');
    expect(store.getState().store.entitlement).toBe('notEntitled');
    expect(store.getState().store.revokedNotice).toBe(true);
    expect(store.getState().preferences.favoriteFlames).toEqual(['cherry', 'golden']);
  });

  it('an owner who is offline stays an owner (a failed re-check changes nothing)', async () => {
    const { store } = createStore();
    let result: EntitlementCheck = 'entitled';
    const service = { ...createFakeService(), checkEntitlement: async () => result };
    await store.init(service);
    result = 'unknown';
    await store.recheckEntitlement();
    expect(store.getState().store.entitlement).toBe('entitled');
  });

  it('clears the purchase confirmation when a recheck finds the entitlement is gone', async () => {
    const { store } = createStore();
    await store.init(createFakeService());
    await store.purchase();
    expect(store.getState().store.justPurchased).toBe(true);

    await store.recheckEntitlement();
    expect(store.getState().store).toMatchObject({ entitlement: 'notEntitled', justPurchased: false, revokedNotice: true });
  });
});

describe('plusStore — saving preferences', () => {
  it('refuses to save without a verified entitlement and writes nothing', async () => {
    const { store, writes } = createStore();
    await store.init(createFakeService({ entitlement: 'notEntitled' }));
    const result = await store.savePreferences(favorites());
    expect(result).toEqual({ ok: false, reason: 'notEntitled' });
    expect(writes).toEqual([]);
  });

  it('rejects an empty favourites set', async () => {
    const { store, writes } = createStore();
    await store.init(createFakeService({ entitlement: 'entitled' }));
    const result = await store.savePreferences(favorites({ favoriteFlames: [] }));
    expect(result).toEqual({ ok: false, reason: 'invalid' });
    expect(writes).toHaveLength(0);
  });

  it('commits only after the durable write succeeded', async () => {
    const { store, writes, getStored } = createStore();
    await store.init(createFakeService({ entitlement: 'entitled' }));
    const result = await store.savePreferences(favorites());
    expect(result).toEqual({ ok: true });
    expect(writes).toHaveLength(1);
    expect(parsePlusPreferences(getStored()).favoriteFlames).toEqual(['cherry', 'golden']);
    expect(store.getState().preferences.flameMode).toBe('favorites');
  });

  it('a failed write is reported honestly and leaves the committed state untouched', async () => {
    const { store } = createStore(null, false);
    await store.init(createFakeService({ entitlement: 'entitled' }));
    const result = await store.savePreferences(favorites());
    expect(result).toEqual({ ok: false, reason: 'storage' });
    expect(store.getState().preferences.flameMode).toBe('auto');
  });

  it('serialises quick saves so the later one wins', async () => {
    const { store, getStored } = createStore();
    await store.init(createFakeService({ entitlement: 'entitled' }));
    await Promise.all([
      store.savePreferences(favorites({ favoriteFlames: ['cherry'] })),
      store.savePreferences(favorites({ favoriteFlames: ['dragon'] })),
    ]);
    expect(parsePlusPreferences(getStored()).favoriteFlames).toEqual(['dragon']);
  });

  it('preserves other changes when a real Fire lands during a preference save', async () => {
    const writes: string[] = [];
    const completions: ((ok: boolean) => void)[] = [];
    const store = createPlusStore({
      readPreferences: () => null,
      writePreferences: (value) => new Promise((resolve) => {
        writes.push(value);
        completions.push(resolve);
      }),
      createService: async () => createFakeService({ entitlement: 'entitled' }),
    });
    await store.init();
    const saveScene = store.savePreferences({ scene: 'aurora' });
    await vi.waitFor(() => expect(writes).toHaveLength(1));
    store.recordRealFlame('comet');
    const saveFlame = store.savePreferences({ flameMode: 'fixed', fixedFlame: 'lotus' });

    completions[0](true);
    await saveScene;
    expect(store.getState().preferences.lastRealFlame).toBe('comet');
    await vi.waitFor(() => expect(writes).toHaveLength(2));
    expect(parsePlusPreferences(writes[1])).toMatchObject({ scene: 'aurora', lastRealFlame: 'comet' });
    completions[1](true);
    await vi.waitFor(() => expect(writes).toHaveLength(3));
    completions[2](true);
    await saveFlame;
    expect(parsePlusPreferences(writes[2])).toMatchObject({ scene: 'aurora', fixedFlame: 'lotus', lastRealFlame: 'comet' });
  });

  it('remembers the last real flame in memory even for non-owners, without writing', async () => {
    const { store, writes } = createStore();
    await store.init(createFakeService({ entitlement: 'notEntitled' }));
    store.recordRealFlame('golden');
    expect(store.getState().preferences.lastRealFlame).toBe('golden');
    await Promise.resolve();
    expect(writes).toEqual([]);
  });
});

describe('plusStore — screens', () => {
  it('stacks screens, returns one step on close, and drops drafts when the last one closes', () => {
    const { store } = createStore();
    store.openScreen('flames');
    store.setFlameDraft(favorites());
    store.openScreen('intro');
    expect(store.getState().routeStack).toEqual(['flames', 'intro']);

    store.closeScreen();
    expect(store.getState().routeStack).toEqual(['flames']);
    expect(store.getState().flameDraft).not.toBeNull();

    store.closeScreen();
    expect(store.getState().routeStack).toEqual([]);
    expect(store.getState().flameDraft).toBeNull();
  });

  it('opening the same screen twice does not stack it', () => {
    const { store } = createStore();
    store.openScreen('intro');
    store.openScreen('intro');
    expect(store.getState().routeStack).toEqual(['intro']);
  });

  it('notifies subscribers and stops after unsubscribe', () => {
    const { store } = createStore();
    const listener = vi.fn();
    const off = store.subscribe(listener);
    store.openScreen('monthly');
    expect(listener).toHaveBeenCalled();
    listener.mockClear();
    off();
    store.closeAll();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('plusStore — never interrupts', () => {
  it('purchase updates arriving by themselves never open a screen', async () => {
    const { store } = createStore();
    const service = createFakeService({ purchase: 'pending' });
    await store.init(service);
    expect(store.getState().routeStack).toEqual([]);

    await store.purchase();
    service.emit('granted');
    service.emit('revoked');
    service.emit('granted');
    expect(store.getState().routeStack).toEqual([]);
  });

  it('startup and restore results never open a screen either', async () => {
    const { store } = createStore();
    await store.init(createFakeService({ entitlement: 'entitled', restore: 'restored' }));
    await store.restore();
    await store.recheckEntitlement();
    expect(store.getState().routeStack).toEqual([]);
  });

  it('only an explicit openScreen() call puts a Plus screen on top', () => {
    const { store } = createStore();
    expect(store.getState().routeStack).toEqual([]);
    store.openScreen('intro');
    expect(store.getState().routeStack).toEqual(['intro']);
  });
});
