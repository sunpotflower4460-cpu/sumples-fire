import { useEffect, useMemo, useState } from 'react';
import { FireCard } from './components/FireCard';
import { FireFilters } from './components/FireFilters';
import { FireForm } from './components/FireForm';
import { FireStats } from './components/FireStats';
import { useFireSeeds } from './hooks/useFireSeeds';
import type { FireCategory, FirePriority, FireStage } from './types/fireSeed';
import { categoryLabels, priorityLabels, stageLabels } from './types/fireSeed';

type AppTab = 'today' | 'seeds' | 'info';

type NewFireSeedInput = {
  title: string;
  body: string;
  nextAction: string;
  category: FireCategory;
  priority: FirePriority;
  stage: FireStage;
};

const ONBOARDING_KEY = 'sumples-fire-onboarding-seen-v1';

const tabs: { id: AppTab; label: string; icon: string }[] = [
  { id: 'today', label: '今日', icon: '火' },
  { id: 'seeds', label: '一覧', icon: '芽' },
  { id: 'info', label: '使い方', icon: 'i' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const [isRecordSheetOpen, setIsRecordSheetOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(ONBOARDING_KEY) !== 'true';
  });
  const {
    addSeed,
    deleteSeed,
    filter,
    filteredSeeds,
    focusSeed,
    notice,
    setFilter,
    showExamples,
    stats,
    toggleSeed,
  } = useFireSeeds();

  const hasSeeds = stats.total > 0;
  const currentTitle = useMemo(() => tabs.find((tab) => tab.id === activeTab)?.label ?? '今日', [activeTab]);

  useEffect(() => {
    if (!isRecordSheetOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsRecordSheetOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecordSheetOpen]);

  const closeOnboarding = () => {
    window.localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  const openRecordSheet = () => {
    closeOnboarding();
    setIsRecordSheetOpen(true);
  };

  const handleAddSeed = (input: NewFireSeedInput) => {
    addSeed(input);
    setIsRecordSheetOpen(false);
    setActiveTab('seeds');
  };

  return (
    <main className="mobile-app-shell">
      <header className="app-topbar">
        <div>
          <p className="app-kicker">Sumples Fire</p>
          <h1>{currentTitle}</h1>
        </div>
        <div className="app-icon" aria-hidden="true">火</div>
      </header>

      {notice ? <div className="toast" role="status">{notice}</div> : null}

      <section className="app-screen" aria-live="polite">
        {activeTab === 'today' ? (
          <div className="screen-stack">
            {showOnboarding ? (
              <section className="onboarding-card">
                <p className="eyebrow">ようこそ</p>
                <h2>小さな思いつきを、今日の一歩に。</h2>
                <p>曲の断片、やりたいこと、暮らしのメモ。まずは1つだけ残せば大丈夫です。</p>
                <button className="primary-button" type="button" onClick={openRecordSheet}>最初の火種を記録する</button>
                <button className="text-button" type="button" onClick={closeOnboarding}>あとで見る</button>
              </section>
            ) : null}

            <section className="today-hero">
              <p className="eyebrow">今日やること</p>
              <h2>{focusSeed?.title ?? 'まずは1つ、残してみよう'}</h2>
              <p>{focusSeed?.nextAction || '思いついたことを短く書くだけで、あとから育てやすくなります。'}</p>
              <button className="primary-button" type="button" onClick={openRecordSheet}>＋ 火種を記録</button>
            </section>

            {focusSeed ? (
              <section className="quick-card">
                <div>
                  <span>{categoryLabels[focusSeed.category]}</span>
                  <strong>{priorityLabels[focusSeed.priority]}</strong>
                  <small>{stageLabels[focusSeed.stage]}</small>
                </div>
                <button className="ghost-button" type="button" onClick={() => toggleSeed(focusSeed.id)}>今日やった</button>
              </section>
            ) : null}

            {hasSeeds ? <FireStats stats={stats} /> : null}

            {!hasSeeds ? (
              <section className="empty-guide-card">
                <h3>たとえば、こんなことを残せます</h3>
                <ul>
                  <li>新しい曲のサビ案</li>
                  <li>今日やりたい小さなタスク</li>
                  <li>あとで育てたいアイデア</li>
                </ul>
                <button className="ghost-button" type="button" onClick={showExamples}>例を見てみる</button>
              </section>
            ) : null}
          </div>
        ) : null}

        {activeTab === 'seeds' ? (
          <section className="panel app-panel">
            <div className="list-header compact">
              <div className="section-heading">
                <p className="eyebrow">火種一覧</p>
                <h2>{hasSeeds ? '育てている火種' : 'まだ火種がありません'}</h2>
              </div>
              <button className="ghost-button" type="button" onClick={openRecordSheet}>＋ 記録</button>
            </div>

            {hasSeeds ? <FireFilters filter={filter} onChangeFilter={setFilter} /> : null}

            <div className="cards-stack">
              {filteredSeeds.length > 0 ? (
                filteredSeeds.map((seed) => (
                  <FireCard key={seed.id} seed={seed} onToggle={toggleSeed} onDelete={deleteSeed} />
                ))
              ) : (
                <div className="empty-state rich-empty-state">
                  <p>最初の火種を残しましょう。</p>
                  <span>タイトルだけでも大丈夫です。あとからメモや次の一歩を足せます。</span>
                  <button className="primary-button" type="button" onClick={openRecordSheet}>火種を記録する</button>
                  <button className="ghost-button" type="button" onClick={showExamples}>例を入れる</button>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {activeTab === 'info' ? (
          <section className="panel app-panel settings-panel">
            <div className="section-heading">
              <p className="eyebrow">使い方</p>
              <h2>3ステップで使えます</h2>
            </div>
            <div className="settings-list">
              <article>
                <span>1. 残す</span>
                <p>思いついたことを、タイトルだけでも記録します。</p>
              </article>
              <article>
                <span>2. 一歩を決める</span>
                <p>「30秒だけ試す」など、小さな次の行動を書いておきます。</p>
              </article>
              <article>
                <span>3. 今日やった</span>
                <p>進めた火種は「今日やった」で完了にできます。</p>
              </article>
              <article>
                <span>保存について</span>
                <p>記録はこの端末のブラウザ内に保存されます。アカウント登録は不要です。</p>
              </article>
            </div>
          </section>
        ) : null}
      </section>

      <button className="floating-action" type="button" onClick={openRecordSheet} aria-label="火種を記録する">＋</button>

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

      {isRecordSheetOpen ? (
        <div className="sheet-backdrop" role="presentation" onMouseDown={() => setIsRecordSheetOpen(false)}>
          <section className="record-sheet" role="dialog" aria-modal="true" aria-labelledby="record-sheet-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-handle" aria-hidden="true" />
            <div className="sheet-header">
              <div>
                <p className="eyebrow">記録</p>
                <h2 id="record-sheet-title">火種を残す</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setIsRecordSheetOpen(false)} aria-label="閉じる">×</button>
            </div>
            <FireForm onAddSeed={handleAddSeed} />
          </section>
        </div>
      ) : null}
    </main>
  );
}
