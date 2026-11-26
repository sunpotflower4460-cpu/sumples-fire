import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { NativePreferencesDriver } from './nativePreferencesDriver';
import type { StorageDriver } from './storageDriver';
import { getWebStorageDriver } from './webLocalStorageDriver';

/** Every durable key the app reads. Native storage preloads exactly these. */
export const DURABLE_STORAGE_KEYS = [
  'sumples-fire-seeds-v2',
  'sumples-fire-seeds-v1',
  'sumples-fire-streak-v1',
  'fire-task-sound-enabled-v1',
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
