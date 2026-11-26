import { describe, expect, it, vi } from 'vitest';
import { DURABLE_STORAGE_KEYS } from './appStorage';
import { STORAGE_KEY, LEGACY_STORAGE_KEY, loadStoredSeeds, saveStoredSeeds } from './fireSeedStorage';
import { STREAK_STORAGE_KEY } from './fireStreak';
import { NativePreferencesDriver } from './nativePreferencesDriver';
import type { NativeKeyValueStore } from './nativePreferencesDriver';
import type { StorageDriver } from './storageDriver';

const createNative = (initial: Record<string, string> = {}) => {
  const store = new Map(Object.entries(initial));
  const native: NativeKeyValueStore & { store: Map<string, string> } = {
    store,
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
  };
  return native;
};

const createMirror = (initial: Record<string, string> = {}) => {
  const store = new Map(Object.entries(initial));
  const mirror: StorageDriver & { store: Map<string, string> } = {
    store,
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
  };
  return mirror;
};

const seedJson = JSON.stringify([{ id: 'a', title: '既存タスク', createdAt: '2026-01-01T00:00:00.000Z' }]);

describe('NativePreferencesDriver', () => {
  it('preloads every durable key the app actually uses', () => {
    expect(DURABLE_STORAGE_KEYS).toEqual(expect.arrayContaining([
      STORAGE_KEY,
      LEGACY_STORAGE_KEY,
      STREAK_STORAGE_KEY,
      'fire-task-sound-enabled-v1',
    ]));
  });

  it('migrates existing localStorage tasks into native storage without deleting the original', async () => {
    const native = createNative();
    const mirror = createMirror({ [STORAGE_KEY]: seedJson });

    const driver = await NativePreferencesDriver.create(native, mirror, [STORAGE_KEY]);

    expect(native.store.get(STORAGE_KEY)).toBe(seedJson);
    expect(mirror.store.get(STORAGE_KEY)).toBe(seedJson);
    expect(loadStoredSeeds(driver).map((seed) => seed.title)).toEqual(['既存タスク']);
  });

  it('treats native storage as the source of truth once it has a value', async () => {
    const nativeJson = JSON.stringify([{ id: 'n', title: '端末の値' }]);
    const native = createNative({ [STORAGE_KEY]: nativeJson });
    const mirror = createMirror({ [STORAGE_KEY]: seedJson });

    const driver = await NativePreferencesDriver.create(native, mirror, [STORAGE_KEY]);

    expect(driver.getItem(STORAGE_KEY)).toBe(nativeJson);
  });

  it('restores tasks from native storage when WebView storage was evicted', async () => {
    const native = createNative({ [STORAGE_KEY]: seedJson });
    const driver = await NativePreferencesDriver.create(native, createMirror(), [STORAGE_KEY]);

    expect(loadStoredSeeds(driver)).toHaveLength(1);
  });

  it('keeps the legacy value served only after migration succeeded', async () => {
    const native = createNative();
    native.set = vi.fn(async () => {
      throw new Error('native unavailable');
    });
    const mirror = createMirror({ [STORAGE_KEY]: seedJson });

    await expect(NativePreferencesDriver.create(native, mirror, [STORAGE_KEY])).rejects.toThrow();
    expect(mirror.store.get(STORAGE_KEY)).toBe(seedJson);
  });

  it('writes to native storage in call order and mirrors to localStorage', async () => {
    const native = createNative();
    const mirror = createMirror();
    const driver = await NativePreferencesDriver.create(native, mirror, [STORAGE_KEY]);

    driver.setItem(STORAGE_KEY, 'first');
    driver.setItem(STORAGE_KEY, 'second');
    expect(driver.getItem(STORAGE_KEY)).toBe('second');

    await driver.flush();
    expect(native.set).toHaveBeenNthCalledWith(1, STORAGE_KEY, 'first');
    expect(native.set).toHaveBeenNthCalledWith(2, STORAGE_KEY, 'second');
    expect(native.store.get(STORAGE_KEY)).toBe('second');
    expect(mirror.store.get(STORAGE_KEY)).toBe('second');
  });

  it('still persists natively when the localStorage mirror throws', async () => {
    const native = createNative();
    const mirror: StorageDriver = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    const driver = await NativePreferencesDriver.create(native, mirror, [STORAGE_KEY]);

    expect(saveStoredSeeds(driver, [])).toBe(true);
    await driver.flush();
    expect(native.store.get(STORAGE_KEY)).toBe('[]');
  });

  it('reports asynchronous native write failures and keeps later writes flowing', async () => {
    const native = createNative();
    const driver = await NativePreferencesDriver.create(native, createMirror(), [STORAGE_KEY]);
    const onFailure = vi.fn();
    driver.onWriteFailure(onFailure);

    native.set = vi.fn()
      .mockRejectedValueOnce(new Error('disk full'))
      .mockImplementation(async (key: string, value: string) => {
        native.store.set(key, value);
      });

    driver.setItem(STORAGE_KEY, 'lost');
    driver.setItem(STORAGE_KEY, 'kept');
    await driver.flush();

    expect(onFailure).toHaveBeenCalledWith(STORAGE_KEY);
    expect(native.store.get(STORAGE_KEY)).toBe('kept');
  });
});
