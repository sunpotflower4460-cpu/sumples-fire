import type { StorageDriver } from './storageDriver';

/**
 * StorageDriver backed by `window.localStorage`.
 *
 * Individual `getItem`/`setItem` calls may throw in restricted environments;
 * callers are responsible for catching those errors.
 */
export class WebLocalStorageDriver implements StorageDriver {
  getItem(key: string): string | null {
    return window.localStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    window.localStorage.setItem(key, value);
  }
}

/**
 * Returns a `StorageDriver` backed by `window.localStorage`, or `undefined`
 * if `window` is unavailable or if accessing `localStorage` throws (e.g. in
 * private-browsing environments where storage is blocked).
 */
export const getWebStorageDriver = (): StorageDriver | undefined => {
  if (typeof window === 'undefined') return undefined;
  try {
    // Accessing the property can throw in some environments.
    void window.localStorage;
    return new WebLocalStorageDriver();
  } catch {
    return undefined;
  }
};
