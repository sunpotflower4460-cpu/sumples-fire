import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BurningRitual } from './components/BurningRitual';
import { AshLegacy } from './components/AshLegacy';
import { FireCard } from './components/FireCard';
import { FireCampfire } from './components/FireCampfire';
import { FireDeleteModal } from './components/FireDeleteModal';
import { FireForm } from './components/FireForm';
import { FireSettingsPanel } from './components/FireSettingsPanel';
import { FireStats } from './components/FireStats';
import { useFocusTrap } from './hooks/useFocusTrap';
import { useFireSeeds } from './hooks/useFireSeeds';
import { getStreakState } from './lib/fireStreak';
import type { FireMatrixQuadrant, FireSeed, NewFireSeedInput } from './types/fireSeed';
import { difficultyLabels, quadrantLabels } from './types/fireSeed';

type AppTab = 'today' | 'ash' | 'info';
type BurnOrigin =
  | { kind: 'focus' }
  | { kind: 'queue'; index: number };

const tabs: { id: AppTab; label: string }[] = [
  { id: 'today', label: '今日' },
  { id: 'ash', label: '炭' },
  { id: 'info', label: '設定' },
];

const QUEUE_PAGE_SIZE = 5;

const prefersReducedMotion = () => (
  typeof window !== 'undefined'
    ? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    : false
);

const focusTaskButtonById = (id: string) => {
  const target = Array.from(document.querySelectorAll<HTMLButtonElement>(
    '.fire-button[data-fire-task-id]',
  )).find((button) => button.dataset.fireTaskId === id);

  if (!target) return false;
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  return true;
};

const focusQueuePosition = (index: number) => {
  const queueButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(
    '#up-next-list .fire-button[data-fire-task-id]',
  ));
  const target = queueButtons[Math.min(index, Math.max(0, queueButtons.length - 1))]
    ?? document.querySelector<HTMLButtonElement>('.queue-empty-state .primary-button')
    ?? document.querySelector<HTMLButtonElement>('.matrix-reset-button');

  if (!target) return false;
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  return true;
};

const focusQueueCardAtIndex = (index: number) => {
  const queueCards = Array.from(document.querySelectorAll<HTMLElement>('#up-next-list .fire-card'));
  const target = queueCards[index];
  if (!target) return false;
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  return true;
};

function FlameGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M13.4 2.8c.7 3.6-2.5 4.7-1.2 7.2.6 1.1 1.7 1.6 2.6 1.2 1.2-.5 1.5-2.1 1.2-3.8 2.6 2 4.1 4.5 4.1 7.2A8.1 8.1 0 0 1 12 22a8.1 8.1 0 0 1-8.1-7.4c0-3.8 2.2-6.5 5.8-9.1-.1 2.2.2 3.7 1.2 4.4.2-2.8 1-5.1 2.5-7.1Z"
        fill="currentColor"
      />
      <path d="M12.2 13.1c2 1.7 2.9 3.1 2.9 4.4a3.1 3.1 0 0 1-6.2 0c0-1.3 1.1-2.7 3.3-4.4Z" fill="rgba(255,255,255,.72)" />
    </svg>
  );
}

function ChevronGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 9.5 5 5 5-5" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg className="toast-dismiss-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7l10 10M17 7 7 17" />
    </svg>
  );
}

function TabIcon({ tab }: { tab: AppTab }) {
  if (tab === 'today') {
    return (
      <svg className="tab-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M13.5 3c.6 3.2-2.2 4.2-1 6.5.5 1 1.5 1.4 2.3 1.1 1.1-.5 1.4-1.9 1.1-3.4 2.3 1.8 3.6 4 3.6 6.5A7.5 7.5 0 1 1 4.5 14c0-3.4 2-5.9 5.2-8.2-.1 2 .2 3.3 1.1 4 .2-2.6.9-4.7 2.7-6.8Z" />
        <path d="M12 13.2c1.8 1.5 2.7 2.8 2.7 4a2.7 2.7 0 0 1-5.4 0c0-1.2.9-2.5 2.7-4Z" />
      </svg>
    );
  }

  if (tab === 'ash') {
    return (
      <svg className="tab-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 17.5c2.2-1.3 4.5-2 7-2s4.8.7 7 2" />
        <path d="M7 13.2c1.6-.9 3.3-1.4 5-1.4s3.4.5 5 1.4" />
        <path d="M9.2 8.8c.9-.5 1.9-.8 2.8-.8s1.9.3 2.8.8" />
        <path d="M6.5 20h11" />
      </svg>
    );
  }

  return (
    <svg className="tab-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.7v2.1M12 18.2v2.1M20.3 12h-2.1M5.8 12H3.7M17.9 6.1l-1.5 1.5M7.6 16.4l-1.5 1.5M17.9 17.9l-1.5-1.5M7.6 7.6 6.1 6.1" />
    </svg>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [quadrantFilter, setQuadrantFilter] = useState<FireMatrixQuadrant | null>(null);
  const [queueVisibleCount, setQueueVisibleCount] = useState(QUEUE_PAGE_SIZE);
  const [newSeedId, setNewSeedId] = useState<string | null>(null);
  const [pendingDeleteSeed, setPendingDeleteSeed] = useState<FireSeed | null>(null);
  const appShellRef = useRef<HTMLElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const floatingActionRef = useRef<HTMLButtonElement | null>(null);
  const focusFireButtonRef = useRef<HTMLButtonElement | null>(null);
  const allClearActionRef = useRef<HTMLButtonElement | null>(null);
  const scrollPositionsRef = useRef<Record<AppTab, number>>({ today: 0, ash: 0, info: 0 });
  const hadBurningTaskRef = useRef(false);
  const burnOriginRef = useRef<BurnOrigin | null>(null);
  const lastCompletedBurnOriginRef = useRef<BurnOrigin | null>(null);
  const dialogRef = useFocusTrap<HTMLElement>(isRecordOpen);
  const swipeTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const {
    addSeed,
    allSeeds,
    burnCompletion,
    burnTask,
    burningSpectacle,
    deleteSeed,
    dismissUndoBurn,
    focusSeed,
    notice,
    stats,
    streakData,
    undoBurnCandidate,
    undoLastBurn,
  } = useFireSeeds();

  const openRecord = () => {
    previouslyFocusedElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setIsRecordOpen(true);
  };

  const closeRecord = () => {
    const previousFocus = previouslyFocusedElementRef.current;
    setIsRecordOpen(false);
    window.setTimeout(() => {
      const restoreTarget = previousFocus?.isConnected
        ? previousFocus
        : focusFireButtonRef.current
          ?? allClearActionRef.current
          ?? floatingActionRef.current
          ?? document.querySelector<HTMLElement>('.tab-button[aria-current="page"]');
      restoreTarget?.focus({ preventScroll: true });
    }, 0);
  };

  const closeRecordAfterSubmit = () => {
    previouslyFocusedElementRef.current = null;
    setIsRecordOpen(false);
  };

  const navigateToTab = (nextTab: AppTab, resetPosition = false) => {
    if (nextTab === activeTab) {
      if (resetPosition || window.scrollY > 0) {
        scrollPositionsRef.current[nextTab] = 0;
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: resetPosition || prefersReducedMotion() ? 'auto' : 'smooth',
        });
      }
      return;
    }

    scrollPositionsRef.current[activeTab] = window.scrollY;
    if (resetPosition) scrollPositionsRef.current[nextTab] = 0;
    setActiveTab(nextTab);
  };

  const handleAddSeed = (input: NewFireSeedInput) => {
    const id = addSeed(input);
    lastCompletedBurnOriginRef.current = null;
    closeRecordAfterSubmit();
    navigateToTab('today', true);
    setQuadrantFilter(null);
    setQueueVisibleCount(QUEUE_PAGE_SIZE);
    setNewSeedId(id);
    window.setTimeout(() => {
      if (focusTaskButtonById(id)) return;
      const fallback = focusFireButtonRef.current
        ?? allClearActionRef.current
        ?? floatingActionRef.current
        ?? document.querySelector<HTMLElement>('.tab-button[aria-current="page"]');
      fallback?.focus({ preventScroll: true });
      fallback?.scrollIntoView({
        block: 'nearest',
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      });
    }, 0);
    window.setTimeout(() => setNewSeedId(null), 600);
  };

  const focusPrimaryAction = () => {
    window.setTimeout(() => {
      const target = focusFireButtonRef.current
        ?? allClearActionRef.current
        ?? floatingActionRef.current
        ?? document.querySelector<HTMLElement>('.tab-button[aria-current="page"]');
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({
        block: 'nearest',
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      });
    }, 0);
  };

  const handleUndoBurn = () => {
    const completedOrigin = lastCompletedBurnOriginRef.current;
    const restoredTaskId = undoBurnCandidate?.id;
    const didUndo = undoLastBurn();
    if (!didUndo) return;
    lastCompletedBurnOriginRef.current = null;

    if (completedOrigin?.kind === 'queue' && restoredTaskId) {
      window.setTimeout(() => {
        if (focusTaskButtonById(restoredTaskId)) return;
        if (focusQueuePosition(completedOrigin.index)) return;
        const fallback = focusFireButtonRef.current ?? allClearActionRef.current ?? floatingActionRef.current;
        fallback?.focus({ preventScroll: true });
      }, 0);
      return;
    }

    focusPrimaryAction();
  };

  const handleDismissUndo = () => {
    const completedOrigin = lastCompletedBurnOriginRef.current;
    dismissUndoBurn();
    lastCompletedBurnOriginRef.current = null;

    if (completedOrigin?.kind === 'queue') {
      window.setTimeout(() => {
        if (focusQueuePosition(completedOrigin.index)) return;
        const fallback = focusFireButtonRef.current ?? allClearActionRef.current ?? floatingActionRef.current;
        fallback?.focus({ preventScroll: true });
      }, 0);
      return;
    }

    focusPrimaryAction();
  };

  const requestDelete = (id: string) => {
    const target = allSeeds.find((seed) => seed.id === id);
    if (!target || target.isBurning) return;
    setPendingDeleteSeed(target);
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteSeed) return;
    const id = pendingDeleteSeed.id;
    const didDelete = deleteSeed(id);
    setPendingDeleteSeed(null);
    if (didDelete) {
      lastCompletedBurnOriginRef.current = null;
    }
  };

  const handleCancelDelete = () => {
    setPendingDeleteSeed(null);
  };

  const resetQueueView = () => {
    setQuadrantFilter(null);
    setQueueVisibleCount(QUEUE_PAGE_SIZE);
  };

  const handleMatrixCellClick = (key: FireMatrixQuadrant) => {
    setQuadrantFilter((current) => (current === key ? null : key));
    setQueueVisibleCount(QUEUE_PAGE_SIZE);
    window.setTimeout(() => {
      document.querySelector('.cards-stack')?.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      });
    }, 50);
  };

  const handleSheetSwipeStart = (event: React.TouchEvent) => {
    if (event.touches.length !== 1) {
      swipeTouchStartRef.current = null;
      return;
    }

    const touch = event.touches[0];
    swipeTouchStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };

  const handleSheetSwipeEnd = (event: React.TouchEvent) => {
    const start = swipeTouchStartRef.current;
    swipeTouchStartRef.current = null;
    if (!start) return;

    const touch = event.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const isIntentionalDownwardSwipe = deltaY > 80 && deltaY > Math.abs(deltaX) * 1.25;

    if (isIntentionalDownwardSwipe) {
      closeRecord();
    }
  };

  const handleSheetSwipeCancel = () => {
    swipeTouchStartRef.current = null;
  };

  const hasTasks = stats.total > 0;
  const burnedTasks = allSeeds.filter((seed) => seed.burned);
  const burningTask = allSeeds.find((seed) => seed.isBurning) ?? null;
  const pendingTasks = useMemo(() => allSeeds.filter((seed) => !seed.burned), [allSeeds]);
  const hasPendingTasks = pendingTasks.length > 0;
  const queueTasks = useMemo(
    () => pendingTasks.filter((seed) => seed.id !== focusSeed?.id),
    [pendingTasks, focusSeed?.id],
  );
  const hasQueueTasks = queueTasks.length > 0;
  const shouldShowFloatingAction = activeTab !== 'today' || hasPendingTasks;
  const streakState = getStreakState(streakData.currentStreak);
  const filteredQueueTasks = useMemo(
    () => (quadrantFilter ? queueTasks.filter((seed) => seed.quadrant === quadrantFilter) : queueTasks),
    [queueTasks, quadrantFilter],
  );
  const visibleQueueTasks = useMemo(
    () => filteredQueueTasks.slice(0, queueVisibleCount),
    [filteredQueueTasks, queueVisibleCount],
  );
  const hiddenQueueCount = Math.max(0, filteredQueueTasks.length - visibleQueueTasks.length);
  const nextQueuePageCount = Math.min(QUEUE_PAGE_SIZE, hiddenQueueCount);
  const hasProgressiveQueue = filteredQueueTasks.length > QUEUE_PAGE_SIZE;
  const matrixItems = useMemo(() => ([
    { key: 'doNow', count: queueTasks.filter((seed) => seed.quadrant === 'doNow').length },
    { key: 'schedule', count: queueTasks.filter((seed) => seed.quadrant === 'schedule').length },
    { key: 'quickBurn', count: queueTasks.filter((seed) => seed.quadrant === 'quickBurn').length },
    { key: 'backlog', count: queueTasks.filter((seed) => seed.quadrant === 'backlog').length },
  ] as const), [queueTasks]);

  const handleFireTask = (id: string) => {
    if (burnOriginRef.current !== null) return;
    lastCompletedBurnOriginRef.current = null;

    if (id === focusSeed?.id) {
      burnOriginRef.current = { kind: 'focus' };
    } else {
      const queueIndex = visibleQueueTasks.findIndex((seed) => seed.id === id);
      burnOriginRef.current = queueIndex >= 0
        ? { kind: 'queue', index: queueIndex }
        : { kind: 'focus' };
    }

    burnTask(id);
  };

  useLayoutEffect(() => {
    window.scrollTo({
      top: scrollPositionsRef.current[activeTab] ?? 0,
      left: 0,
      behavior: 'auto',
    });
  }, [activeTab]);

  useEffect(() => {
    const tab = tabs.find((item) => item.id === activeTab);
    document.title = tab ? `${tab.label} — Fire Task` : 'Fire Task';
  }, [activeTab]);

  useEffect(() => {
    if (!hasQueueTasks && quadrantFilter !== null) {
      setQuadrantFilter(null);
      setQueueVisibleCount(QUEUE_PAGE_SIZE);
    }
  }, [hasQueueTasks, quadrantFilter]);

  useEffect(() => {
    const hasBlockingLayer = isRecordOpen || pendingDeleteSeed !== null || burningTask !== null;
    if (!hasBlockingLayer) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isRecordOpen, pendingDeleteSeed, burningTask]);

  useEffect(() => {
    const shell = appShellRef.current;
    if (!shell) return;

    if (burningTask) {
      shell.setAttribute('inert', '');
    } else {
      shell.removeAttribute('inert');
    }

    return () => shell.removeAttribute('inert');
  }, [burningTask]);

  useEffect(() => {
    if (burningTask) {
      hadBurningTaskRef.current = true;
      return;
    }
    if (!hadBurningTaskRef.current) return;
    hadBurningTaskRef.current = false;

    const burnOrigin = burnOriginRef.current;
    burnOriginRef.current = null;

    if (burnCompletion?.status !== 'succeeded') {
      lastCompletedBurnOriginRef.current = null;
      const failedBurnId = burnCompletion?.status === 'failed' ? burnCompletion.id : null;
      const timer = window.setTimeout(() => {
        if (failedBurnId && focusTaskButtonById(failedBurnId)) return;
        const fallback = focusFireButtonRef.current ?? allClearActionRef.current ?? floatingActionRef.current;
        fallback?.focus({ preventScroll: true });
        fallback?.scrollIntoView({
          block: 'nearest',
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        });
      }, 0);
      return () => window.clearTimeout(timer);
    }

    lastCompletedBurnOriginRef.current = burnOrigin;

    const timer = window.setTimeout(() => {
      if (burnOrigin?.kind === 'queue' && focusQueuePosition(burnOrigin.index)) {
        return;
      }

      const activeElement = document.activeElement;
      const hasStableFocus = activeElement instanceof HTMLElement
        && activeElement !== document.body
        && document.contains(activeElement);
      if (hasStableFocus) return;

      const primaryTarget = focusFireButtonRef.current ?? allClearActionRef.current ?? floatingActionRef.current;
      primaryTarget?.focus({ preventScroll: true });
      primaryTarget?.scrollIntoView({
        block: 'nearest',
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [burningTask, burnCompletion]);

  useEffect(() => {
    if (!isRecordOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeRecord();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecordOpen]);

  return (
    <main ref={appShellRef} className={`mobile-app-shell fire-mode streak-${streakState}`}>
      <div className="ambient-embers" aria-hidden="true">
        <i /><i /><i /><i /><i /><i /><i /><i />
      </div>

      <header className="app-topbar">
        <div>
          <p className="app-kicker">Fire Task</p>
          <h1 id="app-screen-title">{activeTab === 'today' ? '今日燃やす' : tabs.find((tab) => tab.id === activeTab)?.label}</h1>
        </div>
      </header>

      <section className="app-screen" aria-labelledby="app-screen-title">
        {activeTab === 'today' ? (
          <div className="screen-stack">
            {!hasTasks ? (
              <section className="brand-hero" aria-label="Fire Task の概要">
                <div className="brand-mark"><FlameGlyph /></div>
                <h2>嫌なタスクを、燃やして終わらせる。</h2>
                <p>まずは1つだけ、燃やしたいことを書きましょう。</p>
                <button className="primary-button" type="button" onClick={openRecord}>最初のタスクを書く</button>
              </section>
            ) : null}

            {focusSeed ? (
              <section className="focus-seed" aria-label="今日の火種">
                <div className="section-heading">
                  <p className="eyebrow">今日の火種</p>
                  <h2>{focusSeed.title}</h2>
                </div>
                {focusSeed.nextAction ? (
                  <div className="focus-next-action">
                    <span>まずこれだけ</span>
                    <p>{focusSeed.nextAction}</p>
                  </div>
                ) : (
                  <p className="focus-hint">次の一歩が思いつかなければ、2分だけ着手してみましょう。</p>
                )}
                <div className="focus-meta">
                  <span>{quadrantLabels[focusSeed.quadrant]}</span>
                  <span>{difficultyLabels[focusSeed.difficulty]}</span>
                  <span>+{focusSeed.ashPoints}炭</span>
                </div>
                <div className="focus-actions">
                  <button
                    ref={focusFireButtonRef}
                    className="fire-button"
                    data-fire-task-id={focusSeed.id}
                    type="button"
                    onClick={() => handleFireTask(focusSeed.id)}
                    disabled={focusSeed.isBurning}
                    aria-label={`「${focusSeed.title}」を完了してFire`}
                  >
                    {focusSeed.isBurning ? '燃焼中...' : '完了したら Fire'}
                  </button>
                </div>
              </section>
            ) : null}

            {hasTasks && !hasPendingTasks ? (
              <section className="all-clear-card" aria-label="未燃焼タスクはありません">
                <div className="all-clear-mark" aria-hidden="true"><FlameGlyph /></div>
                <p className="eyebrow">ALL CLEAR</p>
                <h2>今日の薪は、きれいに燃え尽きました。</h2>
                <p>必要なら次のひとつだけを追加しましょう。何も足さず、火を眺めて終わるのも正解です。</p>
                <button ref={allClearActionRef} className="primary-button" type="button" onClick={openRecord}>次の薪をくべる</button>
              </section>
            ) : null}

            {hasQueueTasks ? (
              <section className="panel app-panel compact-panel task-queue-panel" aria-labelledby="up-next-heading">
                <div className="task-queue-heading">
                  <div className="section-heading">
                    <p className="eyebrow">UP NEXT</p>
                    <h2 id="up-next-heading">その次のタスク</h2>
                  </div>
                  <span className="task-queue-count">
                    {filteredQueueTasks.length > QUEUE_PAGE_SIZE
                      ? `${visibleQueueTasks.length} / ${filteredQueueTasks.length}件`
                      : `${filteredQueueTasks.length}件`}
                  </span>
                </div>

                <section className="matrix-filter-shell" aria-label="次のタスクを4象限で絞り込む">
                  <div className="matrix-filter-heading">
                    <div>
                      <span>4象限</span>
                      <small>{quadrantFilter ? `${quadrantLabels[quadrantFilter]}を表示中` : '必要な時だけ絞り込む'}</small>
                    </div>
                    {quadrantFilter ? (
                      <button type="button" className="matrix-reset-button" onClick={resetQueueView}>
                        すべて
                      </button>
                    ) : null}
                  </div>
                  <div className="matrix-summary">
                    {matrixItems.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className={`matrix-cell matrix-${item.key} ${item.count > 0 ? 'has-items' : 'is-empty'}`}
                        aria-label={`${quadrantLabels[item.key]}: ${item.count}件`}
                        aria-pressed={quadrantFilter === item.key}
                        disabled={item.count === 0 && quadrantFilter !== item.key}
                        onClick={() => handleMatrixCellClick(item.key)}
                      >
                        <span>{quadrantLabels[item.key]}</span>
                        <strong>{item.count}</strong>
                      </button>
                    ))}
                  </div>
                </section>

                <div id="up-next-list" className="cards-stack">
                  {filteredQueueTasks.length > 0 ? (
                    visibleQueueTasks.map((seed) => <FireCard key={seed.id} seed={seed} onFire={handleFireTask} onDelete={requestDelete} isNew={seed.id === newSeedId} />)
                  ) : (
                    <div className="empty-state useful-empty queue-empty-state">
                      <div className="empty-state-icon" aria-hidden="true" />
                      <div className="useful-empty-header">
                        <p>この象限に次のタスクはありません</p>
                        <span>4象限の絞り込みを解除すると、その次のタスクをすべて表示できます。</span>
                      </div>
                      <button className="primary-button" type="button" onClick={resetQueueView}>
                        絞り込みを解除
                      </button>
                    </div>
                  )}
                </div>

                {hasProgressiveQueue ? (
                  <button
                    type="button"
                    className="task-queue-more"
                    aria-controls="up-next-list"
                    aria-expanded={hiddenQueueCount === 0}
                    onClick={() => {
                      if (hiddenQueueCount > 0) {
                        const firstRevealedIndex = visibleQueueTasks.length;
                        setQueueVisibleCount((current) => Math.min(current + QUEUE_PAGE_SIZE, filteredQueueTasks.length));
                        window.setTimeout(() => focusQueueCardAtIndex(firstRevealedIndex), 0);
                      } else {
                        setQueueVisibleCount(QUEUE_PAGE_SIZE);
                      }
                    }}
                  >
                    {hiddenQueueCount > 0
                      ? `次の${nextQueuePageCount}件を見る（残り${hiddenQueueCount}件）`
                      : `最初の${QUEUE_PAGE_SIZE}件に戻す`}
                  </button>
                ) : null}
              </section>
            ) : null}

            {hasTasks ? (
              <FireCampfire
                ashPoints={stats.totalAshPoints}
                streakData={streakData}
                hasPendingTasks={hasPendingTasks}
              />
            ) : null}

            {hasTasks ? (
              <details className="progress-disclosure">
                <summary>
                  <span className="progress-summary-title">
                    <span className="eyebrow">PROGRESS</span>
                    <strong>進捗と称号</strong>
                  </span>
                  <span className="progress-summary-meta" aria-hidden="true">
                    <span>{stats.rank}</span>
                    <span>{stats.totalAshPoints}炭</span>
                    <span className="progress-summary-chevron"><ChevronGlyph /></span>
                  </span>
                </summary>
                <div className="progress-disclosure-body">
                  <FireStats stats={stats} />
                </div>
              </details>
            ) : null}
          </div>
        ) : null}

        {activeTab === 'ash' ? (
          <section className="panel app-panel" aria-labelledby="ash-screen-heading">
            <div className="section-heading ash-screen-heading">
              <p className="eyebrow">ASH ARCHIVE</p>
              <h2 id="ash-screen-heading">炭の記録</h2>
            </div>
            <AshLegacy seeds={burnedTasks} onDelete={requestDelete} />
          </section>
        ) : null}

        {activeTab === 'info' ? (
          <section className="panel app-panel settings-panel" aria-labelledby="settings-screen-heading">
            <div className="section-heading">
              <p className="eyebrow">SETTINGS</p>
              <h2 id="settings-screen-heading">体験とアプリ設定</h2>
            </div>
            <FireSettingsPanel totalTasks={stats.total} />
          </section>
        ) : null}
      </section>

      {undoBurnCandidate ? (
        <div className="toast toast-action" role="group" aria-label="直前のFire">
          <span className="toast-action-message" role="status" aria-live="polite">
            {notice || `「${undoBurnCandidate.title}」をFireしました`}
            <span className="sr-only"> 元に戻す操作が利用できます。</span>
          </span>
          <button
            type="button"
            className="toast-undo-button"
            onClick={handleUndoBurn}
            aria-label={`「${undoBurnCandidate.title}」のFireを元に戻す`}
          >
            元に戻す
          </button>
          <button
            type="button"
            className="toast-dismiss-button"
            onClick={handleDismissUndo}
            aria-label="Fire通知を閉じる"
          >
            <CloseGlyph />
          </button>
        </div>
      ) : notice ? (
        <div className="toast" role="status" aria-live="polite">{notice}</div>
      ) : null}

      {shouldShowFloatingAction ? (
        <button ref={floatingActionRef} className="floating-action" type="button" onClick={openRecord} aria-label="燃やしたいタスクを書く" />
      ) : null}

      <nav className="bottom-tabs" aria-label="アプリの画面切り替え">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-current={activeTab === tab.id ? 'page' : undefined}
            className={activeTab === tab.id ? 'tab-button is-active' : 'tab-button'}
            onClick={() => navigateToTab(tab.id)}
          >
            <span><TabIcon tab={tab.id} /></span>
            {tab.label}
          </button>
        ))}
      </nav>

      {isRecordOpen ? (
        <div className="sheet-backdrop" role="presentation" onClick={closeRecord}>
          <section ref={dialogRef} className="record-sheet" role="dialog" aria-modal="true" aria-labelledby="record-title" onClick={(event) => event.stopPropagation()}>
            <div
              className="sheet-drag-zone"
              onTouchStart={handleSheetSwipeStart}
              onTouchEnd={handleSheetSwipeEnd}
              onTouchCancel={handleSheetSwipeCancel}
            >
              <div className="sheet-handle" aria-hidden="true" />
              <div className="sheet-header">
                <div>
                  <p className="eyebrow">薪をくべる</p>
                  <h2 id="record-title">燃やしたいタスクを書く</h2>
                </div>
                <button className="sheet-close" type="button" onClick={closeRecord} aria-label="閉じる" />
              </div>
            </div>
            <FireForm onAddSeed={handleAddSeed} />
          </section>
        </div>
      ) : null}

      {pendingDeleteSeed ? (
        <FireDeleteModal seed={pendingDeleteSeed} onConfirm={handleConfirmDelete} onCancel={handleCancelDelete} />
      ) : null}

      {burningTask ? <BurningRitual seed={burningTask} spectacle={burningSpectacle ?? undefined} /> : null}
    </main>
  );
}
