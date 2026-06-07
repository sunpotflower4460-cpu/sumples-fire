import { afterEach, describe, expect, it } from 'vitest';
import { WebLocalStorageDriver, getWebStorageDriver } from './webLocalStorageDriver';

const originalWindow = globalThis.window;

afterEach(() => {
  if (originalWindow === undefined) {
    // @ts-expect-error test cleanup for optional window
    delete globalThis.window;
    return;
  }
  Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true });
});

describe('WebLocalStorageDriver', () => {
  it('reads and writes values via window.localStorage', () => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, 'window', {
      value: {
        localStorage: {
          getItem: (k: string) => store.get(k) ?? null,
          setItem: (k: string, v: string) => store.set(k, v),
        },
      },
      configurable: true,
    });

    const driver = new WebLocalStorageDriver();
    driver.setItem('key', 'value');
    expect(driver.getItem('key')).toBe('value');
  });

  it('returns null for a missing key', () => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, 'window', {
      value: {
        localStorage: {
          getItem: (k: string) => store.get(k) ?? null,
          setItem: (k: string, v: string) => store.set(k, v),
        },
      },
      configurable: true,
    });

    const driver = new WebLocalStorageDriver();
    expect(driver.getItem('missing')).toBeNull();
  });
});

describe('getWebStorageDriver', () => {
  it('returns undefined when window is not defined', () => {
    // @ts-expect-error intentionally removing window for SSR test
    delete globalThis.window;
    expect(getWebStorageDriver()).toBeUndefined();
  });

  it('returns undefined when localStorage access throws', () => {
    Object.defineProperty(globalThis, 'window', {
      value: {
        get localStorage() {
          throw new Error('blocked');
        },
      },
      configurable: true,
    });

    expect(getWebStorageDriver()).toBeUndefined();
  });

  it('returns a StorageDriver when localStorage is available', () => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, 'window', {
      value: {
        localStorage: {
          getItem: (k: string) => store.get(k) ?? null,
          setItem: (k: string, v: string) => store.set(k, v),
        },
      },
      configurable: true,
    });

    const driver = getWebStorageDriver();
    expect(driver).not.toBeUndefined();
    driver!.setItem('k', 'v');
    expect(driver!.getItem('k')).toBe('v');
  });
});
