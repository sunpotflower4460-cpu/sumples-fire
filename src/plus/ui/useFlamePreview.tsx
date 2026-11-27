import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { BurningRitual } from '../../components/BurningRitual';
import { getBurnSequenceDuration } from '../../lib/fireAnimationConstants';
import { playSpectacleSequence } from '../../lib/fireSoundEngine';
import { isFireSoundEnabled } from '../../lib/fireSoundSettings';
import type { FireSeed } from '../../types/fireSeed';
import { getFlame } from '../flames';
import type { FlameId } from '../flames';

/*
 * 試し見 (preview) — deliberately isolated.
 *
 * This module may only *draw and play* a flame. It must never import the task
 * store, the streak, or the seed storage, and it never calls burnTask: a preview
 * can therefore not add ash, change rank, growth or streak, or touch the
 * "last real flame" used by favourites. src/plus/previewIsolation.test.ts
 * enforces the import boundary.
 */
const SAMPLE_SEED: FireSeed = {
  id: 'plus-preview-sample',
  title: '試し見の紙片',
  body: '',
  nextAction: '',
  category: 'other',
  priority: 'medium',
  stage: 'spark',
  difficulty: 'normal',
  urgency: 'low',
  importance: 'low',
  quadrant: 'backlog',
  ashPoints: 0,
  burned: false,
  completed: false,
  createdAt: '1970-01-01T00:00:00.000Z',
  updatedAt: '1970-01-01T00:00:00.000Z',
};

const prefersReducedMotion = () => (
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches
);

export type FlamePreview = {
  /** Plays the flame's animation and sound once. Ignored while one is running. */
  play: (id: FlameId) => void;
  stop: () => void;
  /** Render this once, anywhere in the screen. */
  layer: ReactNode;
  playing: FlameId | null;
};

export function useFlamePreview(): FlamePreview {
  const [current, setCurrent] = useState<{ key: number; id: FlameId } | null>(null);
  const sessionRef = useRef<{ timer: number; audio: AbortController } | null>(null);
  const keyRef = useRef(0);

  const clearSession = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    sessionRef.current = null;
    window.clearTimeout(session.timer);
    session.audio.abort();
  }, []);

  const stop = useCallback(() => {
    clearSession();
    setCurrent(null);
  }, [clearSession]);

  const play = useCallback((id: FlameId) => {
    if (sessionRef.current) return;

    const reduceMotion = prefersReducedMotion();
    const audio = new AbortController();
    const timer = window.setTimeout(stop, getBurnSequenceDuration(reduceMotion) + 120);
    sessionRef.current = { timer, audio };
    // The preview obeys the same Fire sound switch as a real Fire.
    if (isFireSoundEnabled()) {
      void playSpectacleSequence(getFlame(id).soundProfile, reduceMotion, audio.signal).catch(() => {});
    }

    keyRef.current += 1;
    setCurrent({ key: keyRef.current, id });
  }, [stop]);

  useEffect(() => {
    const stopWhenHidden = () => {
      if (document.visibilityState === 'hidden') stop();
    };
    document.addEventListener('visibilitychange', stopWhenHidden);
    window.addEventListener('pagehide', stop);
    return () => {
      document.removeEventListener('visibilitychange', stopWhenHidden);
      window.removeEventListener('pagehide', stop);
      clearSession();
    };
  }, [clearSession, stop]);

  return {
    play,
    stop,
    playing: current?.id ?? null,
    layer: current
      ? <BurningRitual key={current.key} preview seed={SAMPLE_SEED} spectacle={getFlame(current.id)} />
      : null,
  };
}
