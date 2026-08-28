import type { FireSeed } from '../types/fireSeed';

export const getBurnTimestamp = (seed: FireSeed) => (
  new Date(seed.burnedAt ?? seed.updatedAt ?? seed.createdAt).getTime()
);

export const sortAshRecordsOldestFirst = (seeds: FireSeed[]) => (
  [...seeds].sort((left, right) => {
    const timestampDifference = getBurnTimestamp(left) - getBurnTimestamp(right);
    if (timestampDifference !== 0) return timestampDifference;
    return left.id.localeCompare(right.id);
  })
);

export const sortAshRecordsNewestFirst = (seeds: FireSeed[]) => (
  sortAshRecordsOldestFirst(seeds).reverse()
);
