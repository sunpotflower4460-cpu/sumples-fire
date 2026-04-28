import { describe, expect, it } from 'vitest';
import { loadStoredSeeds, saveStoredSeeds, STORAGE_KEY, type SeedStorage } from './fireSeedStorage';
import { createSampleSeeds } from './fireSeedModel';

class MemoryStorage implements SeedStorage {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

describe('fireSeedStorage', () => {
  it('saves tasks and loads them again after a new app session', () => {
    const storage = new MemoryStorage();
    const seeds = createSampleSeeds('2026-04-28T00:00:00.000Z');

    expect(saveStoredSeeds(storage, seeds)).toBe(true);

    const reloaded = loadStoredSeeds(storage);
    expect(reloaded).toHaveLength(3);
    expect(reloaded[0].title).toBe('先延ばししていた返信をする');
    expect(reloaded[1].nextAction).toBe('いらない紙を3枚捨てる');
    expect(reloaded[2].burned).toBe(true);
    expect(reloaded[2].ashPoints).toBe(20);
  });

  it('returns an empty array when there is no saved task data', () => {
    const storage = new MemoryStorage();

    expect(loadStoredSeeds(storage)).toEqual([]);
  });

  it('recovers safely from broken saved data', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, 'not-json');

    expect(loadStoredSeeds(storage)).toEqual([]);
  });
});
