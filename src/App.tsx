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

const tabs: { id: AppTab; label: string }[] = [
  { id: 'today', label: '今日' },
  { id: 'ash', label: '炭' },
  { id: 'info', label: '設定' },
];

const prefersReducedMotion = () => (
  typeof window !== 'undefined'
    ? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    : false
);

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
  const [draftTitle, setDraftTitle] = useState('');
  const [quadrantFilter, setQuadrantFilter] = useState<FireMatrixQuadrant | null>(null);
  const [newSeedId, setNewSeedId] = useState<string | null>(null);
  const [pendingDeleteSeed, setPendingDeleteSeed] = useState<FireSeed | null>(null);
  const appShellRef = useRef<HTMLElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const floatingActionRef = useRef<HTMLButtonElement | null>(null);
  const focusFireButtonRef = useRef<HTMLButtonElement | null>(null);
  const allClearActionRef = useRef<HTMLButtonElement | null>(null);
  const scrollPositionsRef = useRef<Record<AppTab, number>>({ today: 0, ash: 0, info: 0 });
  const hadBurningTaskRef = useRef(false);
  const dialogRef = useFocusTrap<HTMLElement>(isRecordOpen);
  const swipeTouchStartY = useRef<number | null>(null);
  const {
    addSeed,
    allSeeds,
    burnTask,
    burningSpectacle,
    deleteSeed,
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
    setIsRecordOpen(false);
    window.setTimeout(() => {
      (previouslyFocusedElementRef.current ?? floatingActionRef.current)?.focus();
    }, 0);
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
    closeRecord();
    navigateToTab('today', true);
    setQuadrantFilter(null);
    setNewSeedId(id);
    window.setTimeout(() => setNewSeedId(null), 600);
  };

  const handleUndoBurn = () => {
    undoLastBurn();
    window.setTimeout(() => {
      (focusFireButtonRef.current ?? floatingActionRef.current)?.focus({ preventScroll: true });
    }, 0);
  };

  const requestDelete = (id: string) => {
    const target = allSeeds.find((seed) => seed.id === id);
    if (!target || target.isBurning) return;
    setPendingDeleteSeed(target);
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteSeed) return;
    const id = pendingDeleteSeed.id;
    setPendingDeleteSeed(null);
    deleteSeed(id);
  };

  const handleCancelDelete = () => {
    setPendingDeleteSeed(null);
  };

  const handleMatrixCellClick = (key: FireMatrixQuadrant) => {
    setQuadrantFilter((current) => (current === key ? null : key));
    window.setTimeout(() => {
      document.querySelector('.cards-stack')?.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      });
    }, 50);
  };

  const handleSheetSwipeStart = (event: React.TouchEvent) => {
    swipeTouchStartY.current = event.touches[0]?.clientY ?? null;
  };

  const handleSheetSwipeEnd = (event: React.TouchEvent) => {
    if (swipeTouchStartY.current === null) return;
    const deltaY = (event.changedTouches[0]?.clientY ?? 0) - swipeTouchStartY.current;
    swipeTouchStartY.current = null;
    if (deltaY > 80) {
      closeRecord();
    }
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
  const visibleTasks = useMemo(
    () => (quadrantFilter ? queueTasks.filter((seed) => seed.quadrant === quadrantFilter) : queueTasks),
    [queueTasks, quadrantFilter],
  );
  const matrixItems = useMemo(() => ([
    { key: 'doNow', count: queueTasks.filter((seed) => seed.quadrant === 'doNow').length },
    { key: 'schedule', count: queueTasks.filter((seed) => seed.quadrant === 'schedule').length },
    { key: 'quickBurn', count: queueTasks.filter((seed) => seed.quadrant === 'quickBurn').length },
    { key: 'backlog', count: queueTasks.filter((seed) => seed.quadrant === 'backlog').length },
  ] as const), [queueTasks]);

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

    const timer = window.setTimeout(() => {
      const activeElement = document.activeElement;
      const hasStableFocus = activeElement instanceof HTMLElement
        && activeElement !== document.body
        && document.contains(activeElement);
      if (hasStableFocus) return;

      (focusFireButtonRef.current ?? allClearActionRef.current ?? floatingActionRef.current)?.focus({ preventScroll: true });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [burningTask]);

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
      <header className="app-topbar">
        <div>
          <p className="app-kicker">Fire Task</p>
          <h1 id="app-screen-title">{activeTab === 'today' ? '今日燃やす' : tabs.find((tab) => tab.id === activeTab)?.label}</h1>
        </div>
      </header>

      {undoBurnCandidate ? (
        <div className="toast toast-action">
          <span className="toast-action-message" role="status" aria-live="polite">
            {notice || `「${undoBurnCandidate.title}」をFireしました`}
          </span>
          <button
            type="button"
            className="toast-undo-button"
            onClick={handleUndoBurn}
            aria-label={`「${undoBurnCandidate.title}」のFireを元に戻す`}
          >
            元に戻す
          </button>
        </div>
      ) : notice ? (
        <div className="toast" role="status" aria-live="polite">{notice}</div>
      ) : null}

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
                    type="button"
                    onClick={() => burnTask(focusSeed.id)}
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
              <section className="panel app-panel compact-panel task-queue-panel">
                <div className="task-queue-heading">
                  <div className="section-heading">
                    <p className="eyebrow">UP NEXT</p>
                    <h2>その次のタスク</h2>
                  </div>
                  <span className="task-queue-count">{visibleTasks.length}件</span>
                </div>

                <section className="matrix-filter-shell" aria-label="次のタスクを4象限で絞り込む">
                  <div className="matrix-filter-heading">
                    <div>
                      <span>4象限</span>
                      <small>{quadrantFilter ? `${quadrantLabels[quadrantFilter]}を表示中` : '必要な時だけ絞り込む'}</small>
                    </div>
                    {quadrantFilter ? (
                      <button type="button" className="matrix-reset-button" onClick={() => setQuadrantFilter(null)}>
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

                <div className="cards-stack">
                  {visibleTasks.length > 0 ? (
                    visibleTasks.map((seed) => <FireCard key={seed.id} seed={seed} onFire={burnTask} onDelete={requestDelete} isNew={seed.id === newSeedId} />)
                  ) : (
                    <div className="empty-state useful-empty queue-empty-state">
                      <div className="empty-state-icon" aria-hidden="true" />
                      <div className="useful-empty-header">
                        <p>この象限に次のタスクはありません</p>
                        <span>4象限の絞り込みを解除すると、その次のタスクをすべて表示できます。</span>
                      </div>
                      <button className="primary-button" type="button" onClick={() => setQuadrantFilter(null)}>
                        絞り込みを解除
                      </button>
                    </div>
                  )}
                </div>
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
          <section className="panel app-panel">
            <div className="section-heading ash-screen-heading">
              <p className="eyebrow">ASH ARCHIVE</p>
              <h2>炭の記録</h2>
            </div>
            <AshLegacy seeds={burnedTasks} onDelete={requestDelete} />
          </section>
        ) : null}

        {activeTab === 'info' ? (
          <section className="panel app-panel settings-panel">
            <div className="section-heading">
              <p className="eyebrow">SETTINGS</p>
              <h2>設定</h2>
            </div>
            <FireSettingsPanel totalTasks={stats.total} />
          </section>
        ) : null}
      </section>

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
            <div className="sheet-drag-zone" onTouchStart={handleSheetSwipeStart} onTouchEnd={handleSheetSwipeEnd}>
              <div className="sheet-handle" aria-hidden="true" />
              <div className="sheet-header">
                <div>
                  <p className="eyebrow">薪をくべる</p>
                  <h2 id="record-title">燃やしたいタスクを書く</h2>
                </div>
                <button className="sheet-close" type="button" onClick={closeRecord} aria-label="閉じる" />
              </div>
            </div>
            <FireForm defaultTitle={draftTitle} onAddSeed={handleAddSeed} onClearDefaultTitle={() => setDraftTitle('')} />
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