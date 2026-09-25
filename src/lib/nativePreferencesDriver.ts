import type { StorageDriver } from './storageDriver';

/**
 * Minimal async key-value surface of `@capacitor/preferences`. Injected so the
 * driver can be unit-tested without the native bridge.
 */
export type NativeKeyValueStore = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
};

export type NativeWriteFailureListener = (key: string) => void;

/**
 * StorageDriver backed by native iOS storage (UserDefaults via Capacitor
 * Preferences).
 *
 * Why: WKWebView localStorage "must be considered transient" — iOS may reclaim
 * WebView storage when the device runs low on space. Tasks are the user's own
 * data, so on native platforms the durable copy lives in UserDefaults instead.
 *
 * Model:
 * - Native storage is the source of truth. All keys are preloaded into an
 *   in-memory cache before the app renders, so reads stay synchronous.
 * - First launch after this driver shipped: a key that exists only in
 *   localStorage is copied to native storage (migration). localStorage is
 *   never deleted, so a failed migration leaves the original data intact.
 * - Writes update the cache, are queued to native storage in order, and are
 *   mirrored best-effort to localStorage as a secondary copy.
 */
export class NativePreferencesDriver implements StorageDriver {
  private readonly cache = new Map<string, string>();
  private writeQueue: Promise<void> = Promise.resolve();
  private readonly failureListeners = new Set<NativeWriteFailureListener>();

  private constructor(
    private readonly native: NativeKeyValueStore,
    private readonly mirror: StorageDriver | undefined,
  ) {}

  static async create(
    native: NativeKeyValueStore,
    mirror: StorageDriver | undefined,
    keys: readonly string[],
  ): Promise<NativePreferencesDriver> {
    const driver = new NativePreferencesDriver(native, mirror);

    for (const key of keys) {
      const nativeValue = await native.get(key);
      if (nativeValue !== null) {
        driver.cache.set(key, nativeValue);
        continue;
      }

      const legacyValue = readMirror(mirror, key);
      if (legacyValue === null) continue;

      // Migrate before rendering: the value is only served from the cache once
      // it is durable natively, and the localStorage original is left as-is.
      await native.set(key, legacyValue);
      driver.cache.set(key, legacyValue);
    }

    return driver;
  }

  getItem(key: string): string | null {
    return this.cache.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.cache.set(key, value);

    try {
      this.mirror?.setItem(key, value);
    } catch {
      // The mirror is a secondary copy; native storage is authoritative.
    }

    this.writeQueue = this.writeQueue
      .then(() => this.native.set(key, value))
      .catch(() => {
        this.failureListeners.forEach((listener) => listener(key));
      });
  }

  /** Resolves once every queued native write has settled. */
  flush(): Promise<void> {
    return this.writeQueue;
  }

  onWriteFailure(listener: NativeWriteFailureListener): () => void {
    this.failureListeners.add(listener);
    return () => {
      this.failureListeners.delete(listener);
    };
  }
}

const readMirror = (mirror: StorageDriver | undefined, key: string): string | null => {
  if (!mirror) return null;
  try {
    return mirror.getItem(key);
  } catch {
    return null;
  }
};
