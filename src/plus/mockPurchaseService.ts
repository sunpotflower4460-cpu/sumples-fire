import type { EntitlementUpdate, PlusPurchaseService } from './purchaseService';
import type { EntitlementCheck, PurchaseOutcome, RestoreOutcome } from './storeState';

/**
 * Scripted purchase service for E2E and local development.
 *
 * It exists only in bundles built with VITE_PLUS_STORE_MOCK=1 (see
 * selectPurchaseService); the release build script fails if any of it ends up
 * in a shipped bundle. It also refuses to run inside the native app.
 *
 * Marker for the bundle check: FIRE_PLUS_MOCK_STORE_MARKER
 */
export type MockStoreScript = {
  product?: 'ready' | 'unavailable' | 'restricted';
  price?: string;
  /** What checkEntitlement reports when nothing has been bought yet. */
  entitlement?: EntitlementCheck;
  purchase?: PurchaseOutcome;
  restore?: RestoreOutcome;
  delayMs?: number;
};

export type MockStoreControl = {
  script: MockStoreScript;
  /** Push an out-of-band update, like Transaction.updates. */
  emit(update: EntitlementUpdate): void;
  readonly calls: string[];
};

const OWNED_KEY = 'fire-plus-mock-owned';

declare global {
  interface Window {
    __FIRE_PLUS_MOCK__?: MockStoreScript;
    __FIRE_PLUS_MOCK_CONTROL__?: MockStoreControl;
  }
}

const readOwned = () => {
  try {
    return window.sessionStorage.getItem(OWNED_KEY) === '1';
  } catch {
    return false;
  }
};

const writeOwned = (owned: boolean) => {
  try {
    if (owned) window.sessionStorage.setItem(OWNED_KEY, '1');
    else window.sessionStorage.removeItem(OWNED_KEY);
  } catch {
    // ignore
  }
};

export const createMockPurchaseService = (): PlusPurchaseService => {
  const listeners = new Set<(update: EntitlementUpdate) => void>();
  const calls: string[] = [];
  const script = (): MockStoreScript => window.__FIRE_PLUS_MOCK__ ?? {};
  const wait = () => new Promise<void>((resolve) => setTimeout(resolve, script().delayMs ?? 0));

  const control: MockStoreControl = {
    get script() {
      return window.__FIRE_PLUS_MOCK__ ?? (window.__FIRE_PLUS_MOCK__ = {});
    },
    set script(value) {
      window.__FIRE_PLUS_MOCK__ = value;
    },
    emit(update) {
      writeOwned(update === 'granted');
      listeners.forEach((listener) => listener(update));
    },
    calls,
  };
  window.__FIRE_PLUS_MOCK_CONTROL__ = control;

  return {
    kind: 'mock',

    async loadProduct() {
      calls.push('loadProduct');
      await wait();
      const product = script().product ?? 'ready';
      if (product === 'ready') return { status: 'ready', displayPrice: script().price ?? '¥800' };
      return { status: product };
    },

    async checkEntitlement() {
      calls.push('checkEntitlement');
      await wait();
      if (readOwned()) return 'entitled';
      return script().entitlement ?? 'notEntitled';
    },

    async purchase() {
      calls.push('purchase');
      await wait();
      const outcome = script().purchase ?? 'success';
      if (outcome === 'success') writeOwned(true);
      return outcome;
    },

    async restore() {
      calls.push('restore');
      await wait();
      const outcome = script().restore ?? (readOwned() ? 'restored' : 'nothing');
      if (outcome === 'restored') writeOwned(true);
      return outcome;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

export const FIRE_PLUS_MOCK_STORE_MARKER = 'FIRE_PLUS_MOCK_STORE_MARKER';
