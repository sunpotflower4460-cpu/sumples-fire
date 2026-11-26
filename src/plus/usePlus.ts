import { useSyncExternalStore } from 'react';
import { plusStore } from './plusStore';
import type { PlusState } from './plusStore';
import { canStartPurchase, isPlusActive } from './storeState';
import { SCENES } from './plusPreferences';
import type { PlusPreferences } from './plusPreferences';

export const usePlusState = (): PlusState => (
  useSyncExternalStore(plusStore.subscribe, plusStore.getState, plusStore.getState)
);

/**
 * Preferences as they actually apply right now. Without a verified entitlement
 * the saved choices are kept (so a restore brings them back) but not applied:
 * flames fall back to おまかせ and the scene to the free 夜の焚き火.
 */
export const getEffectivePreferences = (preferences: PlusPreferences, entitled: boolean): PlusPreferences => (
  entitled
    ? preferences
    : { ...preferences, flameMode: 'auto', scene: 'night', mix: { ...SCENES.night.preset } }
);

export const usePlus = () => {
  const state = usePlusState();
  const entitled = isPlusActive(state.store);
  return {
    state,
    entitled,
    canPurchase: canStartPurchase(state.store),
    effectivePreferences: getEffectivePreferences(state.preferences, entitled),
  };
};
