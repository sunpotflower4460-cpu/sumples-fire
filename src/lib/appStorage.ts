import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { NativePreferencesDriver } from './nativePreferencesDriver';
import type { StorageDriver } from './storageDriver';
import { getWebStorageDriver } from './webLocalStorageDriver';
import { PLUS_PREFERENCES_KEY } from '../plus/plusConstants';

/** Every durable key the app reads. Native storage preloads exactly these. */
export const DURABLE_STORAGE_KEYS = [
  'sumples-fire-seeds-v2',
  'sumples-fire-seeds-v1',
  'sumples-fire-streak-v1',
  'fire-task-sound-enabled-v1',
  // Fire Task Plus display preferences (flame choice, scene, ambient mix).
  // Not an entitlement: the purchase itself is verified by StoreKit.
  PLUS_PREFERENCES_KEY,
] as const;

let nativeDriver: NativePreferencesDriver | null = null;

/**
 * Prepares durable storage before the first render.
 *
 * On iOS the app uses native storage (see NativePreferencesDriver). If the
 * native bridge is unexpectedly unavailable the app falls back to WebView
 * localStorage rather than failing to launch. On the web this is a no-op.
 */
export const initializeAppStorage = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    nativeDriver = await NativePreferencesDriver.create(
      {
        get: async (key) => (await Preferences.get({ key })).value,
        set: (key, value) => Preferences.set({ key, value }),
      },
      getWebStorageDriver(),
      DURABLE_STORAGE_KEYS,
    );
  } catch {
    nativeDriver = null;
  }
};

/** The storage every durable read/write goes through. */
export const getAppStorageDriver = (): StorageDriver | undefined => (
  nativeDriver ?? getWebStorageDriver()
);

/** Subscribe to asynchronous native write failures (no-op on the web). */
export const onAppStorageWriteFailure = (listener: () => void): (() => void) => (
  nativeDriver ? nativeDriver.onWriteFailure(listener) : () => {}
);

/**
 * Write one key and learn whether it was really stored.
 *
 * On iOS this resolves only after the native write succeeded. On the web it
 * reflects whether localStorage accepted the value. Use it for settings the
 * user explicitly saves, where "saved" must never be claimed on a failure.
 */
export const writeDurableConfirmed = async (key: string, value: string): Promise<boolean> => {
  if (nativeDriver) return nativeDriver.writeConfirmed(key, value);

  const driver = getWebStorageDriver();
  if (!driver) return false;
  try {
    driver.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};
