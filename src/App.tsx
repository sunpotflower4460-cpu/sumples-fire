import { useEffect, useMemo, useRef, useState } from 'react';
import { FireCard } from './components/FireCard';
import { FireComfortSettings } from './components/FireComfortSettings';
import { FireFilters } from './components/FireFilters';
import { FireForm } from './components/FireForm';
import { FireStats } from './components/FireStats';
import { useFireSeeds } from './hooks/useFireSeeds';
import type { FireCategory, FireDifficulty, FireLevel, FirePriority, FireStage } from './types/fireSeed';
import { categoryLabels, difficultyLabels, priorityLabels, quadrantDescriptions, quadrantLabels } from './types/fireSeed';

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

const tabs: { id: AppTab; label: string; icon: string }[] = [
  { id: 'today', label: '今日', icon: '🔥' },
  { id: 'ash', label: '炭', icon: '🌑' },
  { id: 'info', label: '使い方', icon: '💡' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const topbarAddRef = useRef<HTMLButtonElement | null>(null);
  const {
    addSeed,
    allSeeds,
    burnTask,
    deleteSeed,
    filter,
    filteredSeeds,
    focusSeed,
    notice,
    setFilter,
    stats,
  } = useFireSeeds();

  const openRecord = () => {
    previouslyFocusedElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setIsRecordOpen(true);
  };

  const closeRecord = () => {
    setIsRecordOpen(false);
    window.setTimeout(() => {
      (previouslyFocusedElementRef.current ?? topbarAddRef.current)?.focus();
    }, 0);
  };

  const handleAddSeed = (input: NewFireSeedInput) => {
    addSeed(input);
    closeRecord();
    setActiveTab('today');
  };

  const openRecordWithTitle = (title: string) => {
    setDraftTitle(title);
    openRecord();
  };

  const hasTasks = stats.total > 0;
  const burnedTasks = allSeeds.filter((seed) => seed.burned);
  const activeTasks = filteredSeeds.filter((seed) => !seed.burned);
  const counts = useMemo(() => {
    const active = allSeeds.filter((seed) => !seed.burned).length;
    const today = allSeeds.filter((seed) => !seed.burned && seed.quadrant === 'doNow').length;
    const burned = allSeeds.filter((seed) => seed.burned).length;
    const all = allSeeds.length;
    return { active, today, burned, all };
  }, [allSeeds]);

  const matrixItems = [
    { key: 'doNow', count: stats.doNow },
    { key: 'schedule', count: stats.schedule },
    { key: 'quickBurn', count: stats.quickBurn },
    { key: 'backlog', count: stats.backlog },
  ] as const;

  useEffect(() => {
    if (!isRecordOpen) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isRecordOpen]);

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
    <main className="mobile-app-shell fire-mode">
      <header className="app-topbar">
        <div>
          <p className="app-kicker">Fire Task</p>
          <h1>{activeTab === 'today' ? '今日燃やす' : tabs.find((tab) => tab.id === activeTab)?.label}</h1>
        </div>
        <button ref={topbarAddRef} className="topbar-add" type="button" onClick={openRecord} aria-label="燃やしたいタスクを書く">＋</button>
      </header>

      {notice ? <div className="toast" role="status">{notice}</div> : null}

      <section className="app-screen" aria-live="polite">
        {activeTab === 'today' ? (
          <div className="screen-stack">
            {!hasTasks ? (
              <section className="brand-hero" aria-label="Fire Task の概要">
                <div className="brand-mark" aria-hidden="true">🔥</div>
                <p className="app-kicker">Fire Task</p>
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
                  <span>{priorityLabels[focusSeed.priority]}</span>
                </div>
                <div className="focus-actions">
                  <button className="fire-button" type="button" onClick={() => burnTask(focusSeed.id)} disabled={focusSeed.isBurning}>
                    {focusSeed.isBurning ? '燃焼中...' : '完了したら Fire'}
                  </button>
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
              {hasTasks ? <FireFilters filter={filter} counts={counts} onChangeFilter={setFilter} /> : null}
              <div className="cards-stack">
                {activeTasks.length > 0 ? (
                  activeTasks.map((seed) => <FireCard key={seed.id} seed={seed} onFire={burnTask} onDelete={deleteSeed} />)
                ) : (
                  <div className="empty-state useful-empty">
                    <p>まだ燃やすタスクがありません</p>
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
                    <button className="primary-button" type="button" onClick={openRecord}>最初のタスクを書く</button>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === 'ash' ? (
          <section className="panel app-panel">
            <div className="section-heading">
              <p className="eyebrow">Ash Log</p>
              <h2>燃やしたタスク</h2>
            </div>
            <section className="ash-score-card compact-ash" aria-label="炭ポイント合計">
              <span>合計</span>
              <strong>{stats.totalAshPoints} 炭</strong>
              <p>{stats.burned}個完了</p>
            </section>
            <div className="cards-stack">
              {burnedTasks.length > 0 ? (
                burnedTasks.map((seed) => <FireCard key={seed.id} seed={seed} onFire={burnTask} onDelete={deleteSeed} />)
              ) : (
                <div className="empty-state useful-empty ash-empty">
                  <p>まだ炭はありません。</p>
                  <span>タスクを終わらせてFireすると、ここに炭として残ります。</span>
                  <button className="primary-button" type="button" onClick={() => setActiveTab('today')}>今日のタスクを見る</button>
                </div>
              )}
            </div>
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
                <p>タスクはこの端末のブラウザ内に保存され、閉じて開き直しても残ります。アカウント登録は不要です。</p>
              </article>
            </div>
          </section>
        ) : null}
      </section>

      <button className="floating-action" type="button" onClick={openRecord} aria-label="燃やしたいタスクを書く">＋</button>

      <nav className="bottom-tabs" aria-label="アプリの画面切り替え">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-current={activeTab === tab.id ? 'page' : undefined}
            className={activeTab === tab.id ? 'tab-button is-active' : 'tab-button'}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {isRecordOpen ? (
        <div className="sheet-backdrop" role="presentation" onClick={closeRecord}>
          <section className="record-sheet" role="dialog" aria-modal="true" aria-labelledby="record-title" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" aria-hidden="true" />
            <div className="sheet-header">
              <div>
                <p className="eyebrow">薪をくべる</p>
                <h2 id="record-title">燃やしたいタスクを書く</h2>
              </div>
              <button className="sheet-close" type="button" onClick={closeRecord} aria-label="閉じる">×</button>
            </div>
            <FireForm defaultTitle={draftTitle} onAddSeed={handleAddSeed} onClearDefaultTitle={() => setDraftTitle('')} />
          </section>
        </div>
      ) : null}
    </main>
  );
}
