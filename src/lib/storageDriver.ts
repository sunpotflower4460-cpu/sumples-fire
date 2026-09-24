/**
 * Synchronous key-value storage driver interface.
 *
 * Matches the synchronous subset of the Web Storage API so that
 * `WebLocalStorageDriver` can be a zero-overhead wrapper while keeping
 * the call-sites decoupled from `window.localStorage`.
 *
 * Implementations:
 * - `WebLocalStorageDriver` — browser / PWA.
 * - `NativePreferencesDriver` — iOS app. Preloads native storage into a cache
 *   before first render so this interface can stay synchronous.
 * `getAppStorageDriver()` in `./appStorage` picks the right one.
 */
export interface StorageDriver {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
