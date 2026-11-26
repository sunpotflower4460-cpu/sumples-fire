import { useSyncExternalStore } from 'react';
import { ambientPlayer } from '../ambientPlayer';
import type { AmbientStatus } from '../ambientPlayer';

export const useAmbientStatus = (): AmbientStatus => (
  useSyncExternalStore(ambientPlayer.subscribe, ambientPlayer.getStatus, ambientPlayer.getStatus)
);
