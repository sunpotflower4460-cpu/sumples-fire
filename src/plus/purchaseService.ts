import type { EntitlementCheck, PurchaseOutcome, RestoreOutcome } from './storeState';

export type ProductResult =
  | { status: 'ready'; displayPrice: string }
  | { status: 'unavailable' }
  | { status: 'restricted' };

/** A change StoreKit reports outside of any button press (Transaction.updates). */
export type EntitlementUpdate = 'granted' | 'revoked';

/**
 * Everything the app needs from the store. Implementations:
 *  - native: StoreKit 2 through the PlusStore Capacitor plugin (iOS app)
 *  - mock:   scripted outcomes for E2E/dev; compiled out of release bundles
 *  - unsupported: web and any other platform without StoreKit
 *
 * Contract: methods never reject. A failure to *find out* is reported as
 * 'unknown' / 'unavailable' — never as "not purchased".
 */
export interface PlusPurchaseService {
  readonly kind: 'native' | 'mock' | 'unsupported';
  loadProduct(): Promise<ProductResult>;
  checkEntitlement(): Promise<EntitlementCheck>;
  purchase(): Promise<PurchaseOutcome>;
  restore(): Promise<RestoreOutcome>;
  subscribe(listener: (update: EntitlementUpdate) => void): () => void;
}

/** Used where StoreKit does not exist (the web build, tests). */
export const createUnsupportedPurchaseService = (): PlusPurchaseService => ({
  kind: 'unsupported',
  loadProduct: async () => ({ status: 'unavailable' }),
  checkEntitlement: async () => 'unknown',
  purchase: async () => 'failed',
  restore: async () => 'unavailable',
  subscribe: () => () => {},
});

/** Resolve with `fallback` if the work takes too long, so no screen waits forever. */
export const withTimeout = <T>(work: Promise<T>, ms: number, fallback: T): Promise<T> => (
  new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  })
);
