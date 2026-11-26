import { registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import { PLUS_PRODUCT_ID } from './plusConstants';
import { withTimeout } from './purchaseService';
import type { EntitlementUpdate, PlusPurchaseService, ProductResult } from './purchaseService';
import type { EntitlementCheck, PurchaseOutcome, RestoreOutcome } from './storeState';

/**
 * JS side of ios/App/App/PlusStorePlugin.swift (StoreKit 2).
 *
 * All verification happens in Swift: a transaction that fails StoreKit's
 * signature check is reported as 'unverified' and never as an entitlement.
 */
export interface PlusStorePlugin {
  getProduct(options: { productId: string }): Promise<{
    found: boolean;
    displayPrice?: string;
    canMakePayments: boolean;
  }>;
  getEntitlement(options: { productId: string }): Promise<{ state: 'entitled' | 'notEntitled' | 'unknown' }>;
  purchase(options: { productId: string }): Promise<{ outcome: PurchaseOutcome }>;
  restore(options: { productId: string }): Promise<{ outcome: RestoreOutcome }>;
  addListener(
    eventName: 'entitlementChanged',
    listener: (event: { state: 'granted' | 'revoked' }) => void,
  ): Promise<PluginListenerHandle>;
}

const PRODUCT_TIMEOUT_MS = 15_000;
const ENTITLEMENT_TIMEOUT_MS = 15_000;
const RESTORE_TIMEOUT_MS = 60_000;

export const createNativePurchaseService = (
  plugin: PlusStorePlugin = registerPlugin<PlusStorePlugin>('PlusStore'),
): PlusPurchaseService => ({
  kind: 'native',

  loadProduct: () => withTimeout<ProductResult>(
    plugin.getProduct({ productId: PLUS_PRODUCT_ID }).then((result) => {
      if (!result.canMakePayments) return { status: 'restricted' } as const;
      if (!result.found || !result.displayPrice) return { status: 'unavailable' } as const;
      return { status: 'ready', displayPrice: result.displayPrice } as const;
    }),
    PRODUCT_TIMEOUT_MS,
    { status: 'unavailable' },
  ),

  checkEntitlement: () => withTimeout<EntitlementCheck>(
    plugin.getEntitlement({ productId: PLUS_PRODUCT_ID }).then((result) => result.state),
    ENTITLEMENT_TIMEOUT_MS,
    'unknown',
  ),

  // No timeout: the system purchase sheet owns this wait, and cutting it short
  // would let the person buy twice.
  purchase: () => plugin.purchase({ productId: PLUS_PRODUCT_ID }).then(
    (result) => result.outcome,
    (): PurchaseOutcome => 'failed',
  ),

  restore: () => withTimeout<RestoreOutcome>(
    plugin.restore({ productId: PLUS_PRODUCT_ID }).then((result) => result.outcome),
    RESTORE_TIMEOUT_MS,
    'unavailable',
  ),

  subscribe: (listener) => {
    let handle: PluginListenerHandle | null = null;
    let removed = false;

    plugin.addListener('entitlementChanged', (event) => {
      listener(event.state as EntitlementUpdate);
    }).then((created) => {
      if (removed) {
        void created.remove();
      } else {
        handle = created;
      }
    }).catch(() => {
      // No native listener: purchases and restores still work through their own calls.
    });

    return () => {
      removed = true;
      void handle?.remove();
    };
  },
});
