import { spectacles } from '../lib/fireBurnSpectacle';
import type { BurnSpectacle, BurnSpectacleType } from '../lib/fireBurnSpectacle';

/**
 * The nine existing flames, in display order. The ids are the existing
 * `BurnSpectacleType`s on purpose: Plus chooses among them, it never adds or
 * renames one, so the free automatic selection keeps working untouched.
 */
export const FLAME_IDS = [
  'normal',
  'blueGhost',
  'golden',
  'explosion',
  'dragon',
  'cherry',
  'ironFire',
  'voidFire',
  'phoenixRise',
] as const satisfies readonly BurnSpectacleType[];

export type FlameId = (typeof FLAME_IDS)[number];

export type FlameCatalogEntry = {
  id: FlameId;
  label: string;
  spectacle: BurnSpectacle;
};

export const FLAME_CATALOG: readonly FlameCatalogEntry[] = FLAME_IDS.map((id) => ({
  id,
  label: spectacles[id].label,
  spectacle: spectacles[id],
}));

export const isFlameId = (value: unknown): value is FlameId => (
  typeof value === 'string' && (FLAME_IDS as readonly string[]).includes(value)
);

export const getFlame = (id: FlameId): BurnSpectacle => spectacles[id];
