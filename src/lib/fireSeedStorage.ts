import { normalizeSeed } from './fireSeedModel';
import type { FireSeed } from '../types/fireSeed';

export const STORAGE_KEY = 'sumples-fire-seeds-v2';
export const LEGACY_STORAGE_KEY = 'sumples-fire-seeds-v1';

export type SeedStorage = Pick<Storage, 'getItem' | 'setItem'>;

const parseSeeds = (raw: string | null): FireSeed[] | null => {
  if (!raw) return null;

  const parsed = JSON.parse(raw) as Partial<FireSeed>[];
  if (!Array.isArray(parsed)) return null;

  return parsed.map((seed, index) => normalizeSeed(seed, index));
};

export const loadStoredSeeds = (storage: SeedStorage | undefined): FireSeed[] => {
  if (!storage) return [];

  try {
    return parseSeeds(storage.getItem(STORAGE_KEY)) ?? parseSeeds(storage.getItem(LEGACY_STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
};

export const saveStoredSeeds = (storage: SeedStorage | undefined, seeds: FireSeed[]) => {
  if (!storage) return false;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(seeds));
    return true;
  } catch {
    return false;
  }
};
