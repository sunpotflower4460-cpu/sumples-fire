/**
 * Synchronous key-value storage driver interface.
 *
 * Matches the synchronous subset of the Web Storage API so that
 * `WebLocalStorageDriver` can be a zero-overhead wrapper while keeping
 * the call-sites decoupled from `window.localStorage`.
 *
 * ## Adding a CapacitorPreferencesDriver
 * Implement this interface and wrap `@capacitor/preferences`.
 * Because Capacitor Preferences is async, the driver will need to either:
 *   a) cache values synchronously (load eagerly on app start), or
 *   b) change the consuming code to async (requires updating `fireSeedStorage`,
 *      `fireSoundSettings`, and `fireStreak` to return Promises).
 * See docs/CAPACITOR_NEXT_STEPS.md for the recommended migration path.
 */
export interface StorageDriver {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
