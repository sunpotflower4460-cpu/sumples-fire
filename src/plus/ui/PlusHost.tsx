import { useEffect, useRef } from 'react';
import { ambientPlayer } from '../ambientPlayer';
import { plusStore } from '../plusStore';
import { usePlusState } from '../usePlus';
import { CampfireSetsScreen } from './CampfireSetsScreen';
import { FlamePickerScreen } from './FlamePickerScreen';
import { MonthlyScreen } from './MonthlyScreen';
import { PlusIntroScreen } from './PlusIntroScreen';
import { SceneEditorScreen } from './SceneEditorScreen';
import type { FireSeed } from '../../types/fireSeed';

/**
 * Renders the Plus screen on top of the stack — one at a time, as the app's
 * modal isolation expects a single overlay. Screens beneath keep their drafts in
 * the store, so stepping back (or buying and returning) loses nothing.
 */
export function PlusHost({ seeds }: { seeds: readonly FireSeed[] }) {
  const { routeStack } = usePlusState();
  const top = routeStack[routeStack.length - 1];
  const wasOpenRef = useRef(false);
  const totalAsh = seeds.reduce((sum, seed) => (seed.burned ? sum + seed.ashPoints : sum), 0);

  // Each scene starts silent, even if the scene on the archive tab was playing.
  useEffect(() => {
    if (top) ambientPlayer.stop();
  }, [top]);

  // Lock the page behind the sheet; restore exactly what was there.
  useEffect(() => {
    if (!top) return undefined;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [top]);

  // When the whole stack closes, hand focus back to what opened it.
  useEffect(() => {
    if (top) {
      wasOpenRef.current = true;
      return undefined;
    }
    if (!wasOpenRef.current) return undefined;
    wasOpenRef.current = false;

    const timer = window.setTimeout(() => {
      const target = plusStore.takeReturnFocus();
      const fallback = document.querySelector<HTMLElement>('.tab-button[aria-current="page"]');
      (target?.isConnected ? target : fallback)?.focus({ preventScroll: true });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [top]);

  switch (top) {
    case 'intro':
      return <PlusIntroScreen key="intro" />;
    case 'flames':
      return <FlamePickerScreen key="flames" />;
    case 'monthly':
      return <MonthlyScreen key="monthly" seeds={seeds} />;
    case 'scene':
      return <SceneEditorScreen key="scene" ashPoints={totalAsh} />;
    case 'sets':
      return <CampfireSetsScreen key="sets" ashPoints={totalAsh} />;
    default:
      return null;
  }
}
