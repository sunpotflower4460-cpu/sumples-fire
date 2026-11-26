import { describe, expect, it, vi } from 'vitest';
import { NativePreferencesDriver } from './nativePreferencesDriver';
import type { NativeKeyValueStore } from './nativePreferencesDriver';
import type { StorageDriver } from './storageDriver';

const createNative = (failures: { set?: boolean; script?: boolean[] } = {}) => {
  const store = new Map<string, string>();
  const native: NativeKeyValueStore & { store: Map<string, string>; failures: { set?: boolean; script?: boolean[] } } = {
    store,
    failures,
    get: async (key) => store.get(key) ?? null,
    set: vi.fn(async (key: string, value: string) => {
      // `script` lists, per write in execution order, whether it fails.
      const scripted = failures.script?.shift();
      if (scripted ?? failures.set) throw new Error('native write failed');
      store.set(key, value);
    }),
  };
  return native;
};

const createMirror = () => {
  const store = new Map<string, string>();
  const mirror: StorageDriver & { store: Map<string, string> } = {
    store,
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
  return mirror;
};

describe('NativePreferencesDriver.writeConfirmed', () => {
  it('resolves true only after native storage accepted the value', async () => {
    const native = createNative();
    const driver = await NativePreferencesDriver.create(native, createMirror(), ['k']);
    expect(await driver.writeConfirmed('k', 'v1')).toBe(true);
    expect(native.store.get('k')).toBe('v1');
    expect(driver.getItem('k')).toBe('v1');
  });

  it('a failed native write resolves false and rolls the cache and mirror back', async () => {
    const native = createNative();
    const mirror = createMirror();
    const driver = await NativePreferencesDriver.create(native, mirror, ['k']);
    await driver.writeConfirmed('k', 'good');

    native.failures.set = true;
    expect(await driver.writeConfirmed('k', 'bad')).toBe(false);
    expect(driver.getItem('k')).toBe('good');
    expect(mirror.store.get('k')).toBe('good');
    expect(native.store.get('k')).toBe('good');
  });

  it('a failed first write leaves no phantom value behind (not even in the mirror)', async () => {
    const native = createNative({ set: true });
    const mirror = createMirror();
    const driver = await NativePreferencesDriver.create(native, mirror, ['k']);
    expect(await driver.writeConfirmed('k', 'never')).toBe(false);
    expect(driver.getItem('k')).toBeNull();
    expect(mirror.store.has('k')).toBe(false);
  });

  it('does not report through the global failure listener — the caller owns the message', async () => {
    const native = createNative({ set: true });
    const driver = await NativePreferencesDriver.create(native, createMirror(), ['k']);
    const listener = vi.fn();
    driver.onWriteFailure(listener);
    await driver.writeConfirmed('k', 'x');
    expect(listener).not.toHaveBeenCalled();
  });

  it('keeps writes ordered, and a failure does not block later writes', async () => {
    const native = createNative();
    const driver = await NativePreferencesDriver.create(native, createMirror(), ['k']);
    native.failures.script = [true, false];
    const first = driver.writeConfirmed('k', 'a');
    const second = driver.writeConfirmed('k', 'b');
    expect(await first).toBe(false);
    expect(await second).toBe(true);
    expect(native.store.get('k')).toBe('b');
  });

  it('plain setItem failures still reach the global listener (existing behaviour)', async () => {
    const native = createNative({ set: true });
    const driver = await NativePreferencesDriver.create(native, createMirror(), ['k']);
    const listener = vi.fn();
    driver.onWriteFailure(listener);
    driver.setItem('k', 'x');
    await driver.flush();
    expect(listener).toHaveBeenCalledWith('k');
  });
});
