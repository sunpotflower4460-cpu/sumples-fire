import { normalizeSeed } from './fireSeedModel';
import type { FireSeed } from '../types/fireSeed';
import type { StorageDriver } from './storageDriver';

export const STORAGE_KEY = 'sumples-fire-seeds-v2';
export const LEGACY_STORAGE_KEY = 'sumples-fire-seeds-v1';

/** @deprecated Use `StorageDriver` from `./storageDriver` directly. */
export type SeedStorage = StorageDriver;

const parseSeeds = (raw: string | null): FireSeed[] | null => {
  if (!raw) return null;

  const parsed = JSON.parse(raw) as Partial<FireSeed>[];
  if (!Array.isArray(parsed)) return null;

  return parsed.map((seed, index) => normalizeSeed(seed, index));
};

export const loadStoredSeeds = (storage: StorageDriver | undefined): FireSeed[] => {
  if (!storage) return [];

  try {
    return parseSeeds(storage.getItem(STORAGE_KEY)) ?? parseSeeds(storage.getItem(LEGACY_STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
};

export const saveStoredSeeds = (storage: StorageDriver | undefined, seeds: FireSeed[]) => {
  if (!storage) return false;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(seeds));
    return true;
  } catch {
    return false;
  }
};
