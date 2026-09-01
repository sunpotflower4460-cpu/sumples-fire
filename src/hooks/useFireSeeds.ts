import { useEffect, useMemo, useRef, useState } from 'react';
import { burnSeed, derivePriority, getFireSeedStats, getFocusSeed, getQuadrant, markSeedBurning, nowIso, sortFireTasks } from '../lib/fireSeedModel';
import { getBurnSequenceDuration } from '../lib/fireAnimationConstants';
import { createFireBurnUndoSnapshot, restoreFireSeedFromUndo } from '../lib/fireBurnUndo';
import type { FireBurnUndoSnapshot } from '../lib/fireBurnUndo';
import { loadStoredSeeds, saveStoredSeeds } from '../lib/fireSeedStorage';
import { selectBurnSpectacle } from '../lib/fireBurnSpectacle';
import type { BurnSpectacle } from '../lib/fireBurnSpectacle';
import { getEffectiveFireStreak, loadFireStreak, recordBurnForStreak, saveFireStreak } from '../lib/fireStreak';
import { playSparkSound, playSpectacleSequence } from '../lib/fireSoundEngine';
import { isFireSoundEnabled } from '../lib/fireSoundSettings';
import { getWebStorageDriver } from '../lib/webLocalStorageDriver';
import type { FireSeed, NewFireSeedInput } from '../types/fireSeed';
import { difficultyAshPoints } from '../types/fireSeed';

type BurnCompletion = {
  id: string;
  status: 'succeeded' | 'failed';
};

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
  const [burnCompletion, setBurnCompletion] = useState<BurnCompletion | null>(null);
  const [undoBurnSnapshot, setUndoBurnSnapshot] = useState<FireBurnUndoSnapshot | null>(null);

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
    const nextSeeds = sortFireTasks([nextSeed, ...seeds]);

    // Creation is only successful once the exact next state is durable. The
    // FireForm already catches this error and keeps the user's draft visible,
    // so a blocked storage environment can never look like a successful add.
    if (!saveStoredSeeds(storageDriverRef.current, nextSeeds)) {
      throw new Error('seed-persistence-failed');
    }

    clearUndoBurn();
    setSeeds(nextSeeds);
    setNotice('薪を追加しました');
    if (isFireSoundEnabled()) {
      void playSparkSound();
    }
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
    setBurnCompletion(null);
    const undoSnapshot = createFireBurnUndoSnapshot(target, streakData);
    const spectacle = selectBurnSpectacle(target.difficulty, streakData.currentStreak);
    const burningSeeds = seeds.map((seed) => (seed.id === id ? markSeedBurning(seed) : seed));
    setBurningSpectacle(spectacle);
    const reduceMotion = prefersReducedMotion();

    if (isFireSoundEnabled()) {
      void playSpectacleSequence(spectacle.soundProfile, reduceMotion);
    }

    // Burning is deliberately transient. The durable seed list and streak are
    // committed only after the ritual completes and the final list is writable.
    setSeeds(burningSeeds);

    const completionDelay = getBurnSequenceDuration(reduceMotion);
    completionTimerRef.current = window.setTimeout(() => {
      const completedSeeds = sortFireTasks(
        burningSeeds.map((seed) => (seed.id === id ? burnSeed(seed) : seed)),
      );

      if (!saveStoredSeeds(storageDriverRef.current, completedSeeds)) {
        setSeeds(seeds);
        setBurnCompletion({ id, status: 'failed' });
        setBurningSpectacle(null);
        activeBurnIdRef.current = null;
        completionTimerRef.current = null;
        setNotice('保存できなかったため、Fireを完了できませんでした。タスクは残しています');
        return;
      }

      const newStreakData = recordBurnForStreak(streakData);
      setSeeds(completedSeeds);
      setStreakData(newStreakData);
      saveFireStreak(newStreakData);
      setBurnCompletion({ id, status: 'succeeded' });
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
    if (!undoBurnSnapshot) return false;

    const id = undoBurnSnapshot.seed.id;
    const target = seeds.find((seed) => seed.id === id);
    if (!target?.burned) {
      clearUndoBurn();
      return false;
    }

    const restoredSeed = restoreFireSeedFromUndo(undoBurnSnapshot, nowIso());
    const restoredSeeds = sortFireTasks(
      seeds.map((seed) => (seed.id === id ? restoredSeed : seed)),
    );

    if (!saveStoredSeeds(storageDriverRef.current, restoredSeeds)) {
      setNotice('保存できなかったため、Fireを元に戻せませんでした');
      return false;
    }

    setSeeds(restoredSeeds);
    setStreakData(undoBurnSnapshot.streakBefore);
    saveFireStreak(undoBurnSnapshot.streakBefore);
    clearUndoBurn();
    setNotice('Fireを取り消しました');
    return true;
  };

  const deleteSeed = (id: string) => {
    const target = seeds.find((seed) => seed.id === id);
    if (!target || target.isBurning) return false;

    const remainingSeeds = seeds.filter((seed) => seed.id !== id);
    if (!saveStoredSeeds(storageDriverRef.current, remainingSeeds)) {
      setNotice('保存できなかったため、削除できませんでした。タスクは残しています');
      return false;
    }

    clearUndoBurn();
    setSeeds(remainingSeeds);
    setNotice('削除しました');
    return true;
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
    burnCompletion,
    undoBurnCandidate,
    addSeed,
    burnTask,
    dismissUndoBurn,
    undoLastBurn,
    deleteSeed,
  };
}
