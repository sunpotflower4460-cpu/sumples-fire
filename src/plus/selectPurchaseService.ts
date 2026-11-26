import { Capacitor } from '@capacitor/core';
import { createNativePurchaseService } from './nativePurchaseService';
import { createUnsupportedPurchaseService } from './purchaseService';
import type { PlusPurchaseService } from './purchaseService';

/**
 * The scripted mock is reachable only through this constant expression.
 * Vite replaces `import.meta.env.VITE_PLUS_STORE_MOCK` at build time, so in a
 * release build this is `null` and the mock module is not part of the bundle
 * at all (scripts/check-release-bundle.mjs verifies that).
 */
const loadMockService = import.meta.env.VITE_PLUS_STORE_MOCK === '1'
  ? async () => (await import('./mockPurchaseService')).createMockPurchaseService()
  : null;

/**
 * Pick the store implementation for this runtime.
 *
 *  - iOS app: always native StoreKit. A mock can never be used here, even if a
 *    stray build flag were set.
 *  - E2E / dev web builds made with VITE_PLUS_STORE_MOCK=1: the scripted mock.
 *  - Everything else (production web, tests): unsupported — no purchase possible.
 */
export const selectPurchaseService = async (
  isNative: boolean = Capacitor.isNativePlatform(),
): Promise<PlusPurchaseService> => {
  if (isNative) return createNativePurchaseService();
  if (loadMockService) return loadMockService();
  return createUnsupportedPurchaseService();
};
