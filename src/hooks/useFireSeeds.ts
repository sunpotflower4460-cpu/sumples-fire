import { useEffect, useMemo, useRef, useState } from 'react';
import { burnSeed, derivePriority, getFireSeedStats, getFocusSeed, getQuadrant, markSeedBurning, nowIso, sortFireTasks } from '../lib/fireSeedModel';
import { getBurnSequenceDuration } from '../lib/fireAnimationConstants';
import { createFireBurnUndoSnapshot, restoreFireSeedFromUndo } from '../lib/fireBurnUndo';
import type { FireBurnUndoSnapshot } from '../lib/fireBurnUndo';
import { loadStoredSeeds, saveStoredSeeds } from '../lib/fireSeedStorage';
import { selectBurnSpectacle } from '../lib/fireBurnSpectacle';
import type { BurnSpectacle } from '../lib/fireBurnSpectacle';
import { getEffectiveFireStreak, loadFireStreak, recordBurnForStreak, saveFireStreak } from '../lib/fireStreak';
import { playSpectacleSequence } from '../lib/fireSoundEngine';
import { isFireSoundEnabled } from '../lib/fireSoundSettings';
import { getWebStorageDriver } from '../lib/webLocalStorageDriver';
import type { FireSeed, NewFireSeedInput } from '../types/fireSeed';
import { difficultyAshPoints } from '../types/fireSeed';

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `seed-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const prefersReducedMotion = () => (
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches
);

const getLocalDayKey = (date = new Date()) => (
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
);

export function useFireSeeds() {
  const storageDriverRef = useRef(getWebStorageDriver());
  const completionTimerRef = useRef<number | null>(null);
  const activeBurnIdRef = useRef<string | null>(null);
  const calendarDayKeyRef = useRef(getLocalDayKey());
  const [calendarRevision, setCalendarRevision] = useState(0);
  const [seeds, setSeeds] = useState<FireSeed[]>(() => sortFireTasks(loadStoredSeeds(storageDriverRef.current)));
  const [notice, setNotice] = useState('');
  const [streakData, setStreakData] = useState(() => loadFireStreak());
  const [burningSpectacle, setBurningSpectacle] = useState<BurnSpectacle | null>(null);
  const [undoBurnSnapshot, setUndoBurnSnapshot] = useState<FireBurnUndoSnapshot | null>(null);

  useEffect(() => {
    const persistedSeeds = seeds.map((seed) => ({ ...seed, isBurning: false }));
    const saved = saveStoredSeeds(storageDriverRef.current, persistedSeeds);
    if (!saved) {
      setNotice('この端末では保存できませんでした');
    }
  }, [seeds]);

  useEffect(() => {
    // Actionable Fire feedback must stay stable for as long as its Undo action
    // exists. Clearing the copy earlier would mutate the same live region and
    // cause assistive technology to announce the completion twice.
    if (!notice || undoBurnSnapshot) return;
    const timer = window.setTimeout(() => setNotice(''), 3200);
    return () => window.clearTimeout(timer);
  }, [notice, undoBurnSnapshot]);

  useEffect(() => {
    let calendarTimer: number | null = null;

    const refreshCalendarState = () => {
      if (document.visibilityState === 'hidden') return;

      const nextDayKey = getLocalDayKey();
      if (nextDayKey !== calendarDayKeyRef.current) {
        calendarDayKeyRef.current = nextDayKey;
        setCalendarRevision((current) => current + 1);
      }

      setStreakData((current) => {
        const effective = getEffectiveFireStreak(current);
        const changed = effective.currentStreak !== current.currentStreak
          || effective.lastBurnDate !== current.lastBurnDate
          || effective.longestStreak !== current.longestStreak;

        if (!changed) return current;
        saveFireStreak(effective);
        return effective;
      });
    };

    const scheduleNextLocalDayRefresh = () => {
      if (calendarTimer !== null) {
        window.clearTimeout(calendarTimer);
      }

      const now = new Date();
      const nextLocalDay = new Date(now);
      nextLocalDay.setHours(24, 0, 0, 50);
      const delay = Math.max(50, nextLocalDay.getTime() - now.getTime());

      calendarTimer = window.setTimeout(() => {
        refreshCalendarState();
        scheduleNextLocalDayRefresh();
      }, delay);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshCalendarState();
      }
    };

    window.addEventListener('focus', refreshCalendarState);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    scheduleNextLocalDayRefresh();

    return () => {
      window.removeEventListener('focus', refreshCalendarState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (calendarTimer !== null) {
        window.clearTimeout(calendarTimer);
      }
    };
  }, []);

  useEffect(() => () => {
    if (completionTimerRef.current !== null) {
      window.clearTimeout(completionTimerRef.current);
    }
  }, []);

  const clearUndoBurn = () => {
    setUndoBurnSnapshot(null);
  };

  const dismissUndoBurn = () => {
    clearUndoBurn();
    setNotice('');
  };

  const addSeed = (input: NewFireSeedInput) => {
    clearUndoBurn();
    const timestamp = nowIso();
    const quadrant = getQuadrant(input.urgency, input.importance);
    const priority = derivePriority(input.urgency, input.importance);
    const id = createId();
    const nextSeed: FireSeed = {
      id,
      title: input.title.trim(),
      body: input.body.trim(),
      nextAction: input.nextAction.trim(),
      category: input.category,
      priority,
      stage: 'spark',
      difficulty: input.difficulty,
      urgency: input.urgency,
      importance: input.importance,
      quadrant,
      ashPoints: difficultyAshPoints[input.difficulty],
      burned: false,
      isBurning: false,
      completed: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setSeeds((current) => sortFireTasks([nextSeed, ...current]));
    setNotice('薪を追加しました');
    return id;
  };

  const burnTask = (id: string) => {
    if (activeBurnIdRef.current !== null) return;

    const target = seeds.find((seed) => seed.id === id);
    if (!target || target.burned || target.isBurning) return;

    // Lock synchronously before any React state update so rapid taps cannot
    // enter this completion flow twice before the disabled UI re-renders.
    activeBurnIdRef.current = id;

    clearUndoBurn();
    const undoSnapshot = createFireBurnUndoSnapshot(target, streakData);
    const spectacle = selectBurnSpectacle(target.difficulty, streakData.currentStreak);
    setBurningSpectacle(spectacle);

    if (isFireSoundEnabled()) {
      void playSpectacleSequence(spectacle.soundProfile);
    }

    const newStreakData = recordBurnForStreak(streakData);
    setStreakData(newStreakData);
    saveFireStreak(newStreakData);

    setSeeds((current) => current.map((seed) => (seed.id === id ? markSeedBurning(seed) : seed)));

    const completionDelay = getBurnSequenceDuration(prefersReducedMotion());
    completionTimerRef.current = window.setTimeout(() => {
      setSeeds((current) => sortFireTasks(current.map((seed) => (seed.id === id ? burnSeed(seed) : seed))));
      setBurningSpectacle(null);
      activeBurnIdRef.current = null;
      completionTimerRef.current = null;
      setUndoBurnSnapshot(undoSnapshot);

      const base = `Fire完了！ +${target.ashPoints}炭になりました`;
      const decorated = target.difficulty === 'boss'
        ? `ラスボス撃破！ +${target.ashPoints}炭になりました`
        : target.difficulty === 'heavy'
          ? `大仕事完了！ +${target.ashPoints}炭になりました`
          : base;
      setNotice(decorated);
    }, completionDelay);
  };

  const undoLastBurn = () => {
    if (!undoBurnSnapshot) return;

    const id = undoBurnSnapshot.seed.id;
    const target = seeds.find((seed) => seed.id === id);
    if (!target?.burned) {
      clearUndoBurn();
      return;
    }

    const restoredSeed = restoreFireSeedFromUndo(undoBurnSnapshot, nowIso());
    setSeeds((current) => sortFireTasks(current.map((seed) => (seed.id === id ? restoredSeed : seed))));
    setStreakData(undoBurnSnapshot.streakBefore);
    saveFireStreak(undoBurnSnapshot.streakBefore);
    clearUndoBurn();
    setNotice('Fireを取り消しました');
  };

  const deleteSeed = (id: string) => {
    const target = seeds.find((seed) => seed.id === id);
    if (!target || target.isBurning) return;

    clearUndoBurn();
    setSeeds((current) => current.filter((seed) => seed.id !== id));
    setNotice('削除しました');
  };

  const focusSeed = useMemo(() => getFocusSeed(seeds), [seeds]);
  const stats = useMemo(() => getFireSeedStats(seeds), [seeds, calendarRevision]);
  const undoBurnCandidate = undoBurnSnapshot
    ? {
        id: undoBurnSnapshot.seed.id,
        title: undoBurnSnapshot.seed.title,
        ashPoints: undoBurnSnapshot.seed.ashPoints,
      }
    : null;

  return {
    allSeeds: sortFireTasks(seeds),
    focusSeed,
    notice,
    stats,
    streakData,
    burningSpectacle,
    undoBurnCandidate,
    addSeed,
    burnTask,
    dismissUndoBurn,
    undoLastBurn,
    deleteSeed,
  };
}
