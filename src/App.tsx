import { useEffect, useMemo, useRef, useState } from 'react';
import { BurningRitual } from './components/BurningRitual';
import { AshLegacy } from './components/AshLegacy';
import { FireCard } from './components/FireCard';
import { FireCampfire } from './components/FireCampfire';
import { FireComfortSettings } from './components/FireComfortSettings';
import { FireConfirmModal } from './components/FireConfirmModal';
import { FireDeleteModal } from './components/FireDeleteModal';
import { FireFilters, type TodayFireFilter } from './components/FireFilters';
import { FireForm } from './components/FireForm';
import { FireStats } from './components/FireStats';
import { useFocusTrap } from './hooks/useFocusTrap';
import { useFireSeeds } from './hooks/useFireSeeds';
import { getStreakState } from './lib/fireStreak';
import type { FireCategory, FireDifficulty, FireLevel, FireMatrixQuadrant, FirePriority, FireSeed, FireStage } from './types/fireSeed';
import { difficultyLabels, priorityLabels, quadrantDescriptions, quadrantLabels } from './types/fireSeed';

type AppTab = 'today' | 'ash' | 'info';

type NewFireSeedInput = {
  title: string;
  body: string;
  nextAction: string;
  category: FireCategory;
  priority: FirePriority;
  stage: FireStage;
  difficulty: FireDifficulty;
  urgency: FireLevel;
  importance: FireLevel;
};

const tabs: { id: AppTab; label: string }[] = [
  { id: 'today', label: '今日' },
  { id: 'ash', label: '炭' },
  { id: 'info', label: '使い方' },
];

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
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 10.5V16" />
      <path d="M12 7.6h.01" />
    </svg>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [quadrantFilter, setQuadrantFilter] = useState<FireMatrixQuadrant | null>(null);
  const [newSeedId, setNewSeedId] = useState<string | null>(null);
  const [pendingBurnSeed, setPendingBurnSeed] = useState<FireSeed | null>(null);
  const [pendingDeleteSeed, setPendingDeleteSeed] = useState<FireSeed | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const floatingActionRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useFocusTrap<HTMLElement>(isRecordOpen);
  const swipeTouchStartY = useRef<number | null>(null);
  const {
    addSeed,
    allSeeds,
    burnTask,
    burningSpectacle,
    deleteSeed,
    filter,
    filteredSeeds,
    focusSeed,
    notice,
    setFilter,
    stats,
    streakData,
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

  const handleAddSeed = (input: NewFireSeedInput) => {
    const id = addSeed(input);
    closeRecord();
    setActiveTab('today');
    setQuadrantFilter(null);
    setNewSeedId(id);
    window.setTimeout(() => setNewSeedId(null), 600);
  };

  const openRecordWithTitle = (title: string) => {
    setDraftTitle(title);
    openRecord();
  };

  const requestBurn = (id: string) => {
    const target = allSeeds.find((seed) => seed.id === id);
    if (!target || target.burned || target.isBurning) return;
    setPendingBurnSeed(target);
  };

  const handleConfirmBurn = () => {
    if (!pendingBurnSeed) return;
    const id = pendingBurnSeed.id;
    setPendingBurnSeed(null);
    burnTask(id);
  };

  const handleCancelBurn = () => {
    setPendingBurnSeed(null);
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
    setActiveTab('today');
    setFilter('active');
    setQuadrantFilter(key);
    window.setTimeout(() => {
      document.querySelector('.cards-stack')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  const hasPendingTasks = allSeeds.some((seed) => !seed.burned);
  const streakState = getStreakState(streakData.currentStreak);
  const todayFilter: TodayFireFilter = filter === 'today' ? 'today' : 'active';
  const shouldShowViewAllButton = hasPendingTasks && (todayFilter === 'today' || quadrantFilter !== null);
  const visibleTasks = useMemo(() => {
    const base = filteredSeeds.filter((seed) => !seed.burned);
    return quadrantFilter ? base.filter((seed) => seed.quadrant === quadrantFilter) : base;
  }, [filteredSeeds, quadrantFilter]);
  const counts = useMemo(() => {
    const active = allSeeds.filter((seed) => !seed.burned).length;
    const today = allSeeds.filter((seed) => !seed.burned && seed.quadrant === 'doNow').length;
    return { active, today };
  }, [allSeeds]);

  const matrixItems = [
    { key: 'doNow', count: stats.doNow },
    { key: 'schedule', count: stats.schedule },
    { key: 'quickBurn', count: stats.quickBurn },
    { key: 'backlog', count: stats.backlog },
  ] as const;

  useEffect(() => {
    const tab = tabs.find((item) => item.id === activeTab);
    document.title = tab ? `${tab.label} — Fire Task` : 'Fire Task';
  }, [activeTab]);

  useEffect(() => {
    const hasBlockingDialog = isRecordOpen || pendingBurnSeed !== null || pendingDeleteSeed !== null;
    if (!hasBlockingDialog) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isRecordOpen, pendingBurnSeed, pendingDeleteSeed]);

  useEffect(() => {
    if (activeTab !== 'today') return;
    if (filter === 'active' || filter === 'today') return;
    setFilter('active');
  }, [activeTab, filter, setFilter]);

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
    <main className={`mobile-app-shell fire-mode streak-${streakState}`}>
      <header className="app-topbar">
        <div>
          <p className="app-kicker">Fire Task</p>
          <h1>{activeTab === 'today' ? '今日燃やす' : tabs.find((tab) => tab.id === activeTab)?.label}</h1>
        </div>
      </header>

      {notice ? <div className="toast" role="status" aria-live="polite">{notice}</div> : null}

      <section className="app-screen" aria-live="polite">
        {activeTab === 'today' ? (
          <div className="screen-stack">
            {!hasTasks ? (
              <section className="brand-hero" aria-label="Fire Task の概要">
                <div className="brand-mark"><FlameGlyph /></div>
                <p className="app-kicker">Fire Task</p>
                <h2>嫌なタスクを、燃やして終わらせる。</h2>
                <p>まずは1つだけ、燃やしたいことを書きましょう。</p>
                <button className="primary-button" type="button" onClick={openRecord}>最初のタスクを書く</button>
              </section>
            ) : null}

            <FireCampfire
              ashPoints={stats.totalAshPoints}
              streakData={streakData}
              hasPendingTasks={hasPendingTasks}
            />

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
                  <span>{priorityLabels[focusSeed.priority]}</span>
                </div>
                <div className="focus-actions">
                  <div className="fire-button-wrapper">
                    <button className="fire-button" type="button" onClick={() => requestBurn(focusSeed.id)} disabled={focusSeed.isBurning}>
                      {focusSeed.isBurning ? '燃焼中...' : '完了したら Fire'}
                    </button>
                    <span className="rank-chip" aria-label={`現在の称号: ${stats.rank}`}>{stats.rank}</span>
                  </div>
                  <button className="ghost-button" type="button" onClick={openRecord}>タスクを追加</button>
                </div>
              </section>
            ) : null}

            <section className="ash-score-card" aria-label="炭ポイント">
              <span>炭ポイント</span>
              <strong>{stats.totalAshPoints}</strong>
              <p>{stats.burned}個のタスクを燃やしました</p>
            </section>

            <FireStats stats={stats} />

            <section className="matrix-summary" aria-label="緊急度重要度マトリクス">
              {matrixItems.map((item) => (
                <article
                  key={item.key}
                  className={`matrix-cell matrix-${item.key} ${item.count > 0 ? 'has-items' : 'is-empty'}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${quadrantLabels[item.key]}: ${item.count}件`}
                  onClick={() => handleMatrixCellClick(item.key)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleMatrixCellClick(item.key);
                    }
                  }}
                >
                  <span>{quadrantLabels[item.key]}</span>
                  <strong>{item.count}</strong>
                  <p>{quadrantDescriptions[item.key]}</p>
                </article>
              ))}
            </section>

            <section className="panel app-panel compact-panel">
              <div className="section-heading">
                <p className="eyebrow">Matrix Sorted</p>
                <h2>自動で並んだタスク</h2>
              </div>
              {hasTasks ? <FireFilters filter={todayFilter} counts={counts} onChangeFilter={(nextFilter) => { setFilter(nextFilter); setQuadrantFilter(null); }} /> : null}
              {quadrantFilter ? (
                <div className="quadrant-filter-bar">
                  <span>{quadrantLabels[quadrantFilter]}のみ表示中</span>
                  <button type="button" className="ghost-button" onClick={() => setQuadrantFilter(null)}>クリア</button>
                </div>
              ) : null}
              <div className="cards-stack">
                {visibleTasks.length > 0 ? (
                  visibleTasks.map((seed) => <FireCard key={seed.id} seed={seed} onFire={requestBurn} onDelete={requestDelete} isNew={seed.id === newSeedId} />)
                ) : (
                  <div className="empty-state useful-empty">
                    <div className="empty-state-icon" aria-hidden="true">🪵</div>
                    <div className="useful-empty-header">
                      <p>{hasPendingTasks ? '条件に合う未燃焼タスクがありません' : '薪（タスク）をくべよう！'}</p>
                      <span>{hasPendingTasks ? 'フィルターを切り替えるか、新しい薪を1つ追加してみましょう' : '燃やしたいことを1つだけ書いてみましょう'}</span>
                    </div>
                    {shouldShowViewAllButton ? (
                      <button className="ghost-button" type="button" onClick={() => { setFilter('active'); setQuadrantFilter(null); }}>未燃焼をすべて表示</button>
                    ) : null}
                    <span>おすすめ:</span>
                    <ul>
                      {['先延ばししていた返信をする', '机の上を3分だけ片付ける', '面倒な書類を1つ確認する'].map((idea) => (
                        <li key={idea}>
                          <button type="button" className="idea-button" onClick={() => openRecordWithTitle(idea)}>
                            {idea}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button className="primary-button" type="button" onClick={openRecord}>{hasPendingTasks ? 'タスクを追加' : '最初のタスクを書く'}</button>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === 'ash' ? (
          <section className="panel app-panel">
            <div className="section-heading">
              <p className="eyebrow">Ash Legacy</p>
              <h2>炭の遺産</h2>
            </div>
            <AshLegacy seeds={burnedTasks} onDelete={requestDelete} />
          </section>
        ) : null}

        {activeTab === 'info' ? (
          <section className="panel app-panel settings-panel">
            <div className="section-heading">
              <p className="eyebrow">使い方</p>
              <h2>燃やして終わらせるタスク帳です</h2>
            </div>
            <div className="settings-list">
              <FireComfortSettings totalTasks={stats.total} />
              <article>
                <span>1. タスクを書く</span>
                <p>やりたくないこと、先延ばししていることを短く書きます。</p>
              </article>
              <article>
                <span>2. 緊急度と重要度を決める</span>
                <p>高低を選ぶだけで、Fire Taskが4象限に自動分類して並べます。</p>
              </article>
              <article>
                <span>3. Fireする</span>
                <p>終わったらFireボタンを押します。タスクは炭になり、炭ポイントが増えます。</p>
              </article>
              <article>
                <span>保存について</span>
                <p>タスクはこの端末内に保存されます。アカウント登録は不要です。アプリを閉じて開き直してもタスクは残ります。</p>
              </article>
              <article>
                <span>プライバシーについて</span>
                <p>入力したタスクはこの端末内だけで扱われ、運営者のサーバーへ送信する機能はありません。くわしくはプライバシーポリシーをご確認ください。</p>
              </article>
              <article>
                <span>公開情報</span>
                <p><a href="/privacy.html">プライバシーポリシー</a> / <a href="/support.html">サポート情報</a></p>
              </article>
            </div>
          </section>
        ) : null}
      </section>

      <button ref={floatingActionRef} className="floating-action" type="button" onClick={openRecord} aria-label="燃やしたいタスクを書く">＋</button>

      <nav className="bottom-tabs" aria-label="アプリの画面切り替え">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-current={activeTab === tab.id ? 'page' : undefined}
            className={activeTab === tab.id ? 'tab-button is-active' : 'tab-button'}
            onClick={() => setActiveTab(tab.id)}
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
                <button className="sheet-close" type="button" onClick={closeRecord} aria-label="閉じる">×</button>
              </div>
            </div>
            <FireForm defaultTitle={draftTitle} onAddSeed={handleAddSeed} onClearDefaultTitle={() => setDraftTitle('')} />
          </section>
        </div>
      ) : null}

      {pendingBurnSeed ? (
        <FireConfirmModal seed={pendingBurnSeed} onConfirm={handleConfirmBurn} onCancel={handleCancelBurn} />
      ) : null}

      {pendingDeleteSeed ? (
        <FireDeleteModal seed={pendingDeleteSeed} onConfirm={handleConfirmDelete} onCancel={handleCancelDelete} />
      ) : null}

      {burningTask ? <BurningRitual seed={burningTask} spectacle={burningSpectacle ?? undefined} /> : null}
    </main>
  );
}
