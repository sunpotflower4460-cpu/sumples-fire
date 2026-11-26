import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('selectPurchaseService', () => {
  it('uses native StoreKit inside the iOS app, even if the mock flag leaked into the build', async () => {
    vi.stubEnv('VITE_PLUS_STORE_MOCK', '1');
    vi.resetModules();
    const { selectPurchaseService } = await import('./selectPurchaseService');
    expect((await selectPurchaseService(true)).kind).toBe('native');
  });

  it('release web builds have no way to buy (no mock, no native)', async () => {
    vi.stubEnv('VITE_PLUS_STORE_MOCK', '');
    vi.resetModules();
    const { selectPurchaseService } = await import('./selectPurchaseService');
    const service = await selectPurchaseService(false);
    expect(service.kind).toBe('unsupported');
    expect(await service.loadProduct()).toEqual({ status: 'unavailable' });
    expect(await service.checkEntitlement()).toBe('unknown');
    expect(await service.restore()).toBe('unavailable');
  });
});
