import { useState } from 'react';
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

const tabs: { id: AppTab; label: string; icon: string }[] = [
  { id: 'today', label: '今日', icon: '火' },
  { id: 'seeds', label: 'メモ', icon: '芽' },
  { id: 'info', label: '使い方', icon: 'i' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const {
    addSeed,
    deleteSeed,
    filter,
    filteredSeeds,
    focusSeed,
    notice,
    setFilter,
    stats,
    toggleSeed,
  } = useFireSeeds();

  const openRecord = () => setIsRecordOpen(true);
  const closeRecord = () => setIsRecordOpen(false);
  const handleAddSeed = (input: NewFireSeedInput) => {
    addSeed(input);
    setIsRecordOpen(false);
    setActiveTab('seeds');
  };

  const hasSeeds = stats.total > 0;

  return (
    <main className="mobile-app-shell">
      <header className="app-topbar">
        <div>
          <p className="app-kicker">Sumples Fire</p>
          <h1>{tabs.find((tab) => tab.id === activeTab)?.label}</h1>
        </div>
        <button className="topbar-add" type="button" onClick={openRecord} aria-label="メモを書く">＋</button>
      </header>

      {notice ? <div className="toast" role="status">{notice}</div> : null}

      <section className="app-screen" aria-live="polite">
        {activeTab === 'today' ? (
          <div className="screen-stack">
            <section className="welcome-card">
              <span>小さなメモを、今日の一歩に。</span>
              <h2>思いついたことを、すぐ残せます。</h2>
              <p>やること、曲の断片、暮らしのメモ。あとで見返して、次の一歩にできます。</p>
            </section>

            <section className="today-hero">
              <p className="eyebrow">今日のメモ</p>
              <h2>{focusSeed?.title ?? 'まずはメモを書こう'}</h2>
              <p>{focusSeed?.nextAction || '例：今日やること、あとで試したいこと、曲や歌詞のアイデア。'}</p>
              <button className="primary-button" type="button" onClick={openRecord}>＋ メモを書く</button>
            </section>

            {focusSeed ? (
              <section className="quick-card">
                <div>
                  <span>{categoryLabels[focusSeed.category]}</span>
                  <strong>{priorityLabels[focusSeed.priority]}</strong>
                  <small>{stageLabels[focusSeed.stage]}</small>
                </div>
                <button className="ghost-button" type="button" onClick={() => toggleSeed(focusSeed.id)}>完了にする</button>
              </section>
            ) : null}

            <FireStats stats={stats} />
          </div>
        ) : null}

        {activeTab === 'seeds' ? (
          <section className="panel app-panel">
            <div className="list-header compact">
              <div className="section-heading">
                <p className="eyebrow">メモ</p>
                <h2>保存したメモ</h2>
              </div>
            </div>

            {hasSeeds ? <FireFilters filter={filter} onChangeFilter={setFilter} /> : null}

            <div className="cards-stack">
              {filteredSeeds.length > 0 ? (
                filteredSeeds.map((seed) => (
                  <FireCard key={seed.id} seed={seed} onToggle={toggleSeed} onDelete={deleteSeed} />
                ))
              ) : (
                <div className="empty-state useful-empty">
                  <p>まだメモがありません。</p>
                  <span>たとえば、こんなことを残せます。</span>
                  <ul>
                    <li>今日やること</li>
                    <li>曲や歌詞のアイデア</li>
                    <li>買い物や用事</li>
                    <li>あとで試したいこと</li>
                  </ul>
                  <button className="primary-button" type="button" onClick={openRecord}>最初のメモを書く</button>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {activeTab === 'info' ? (
          <section className="panel app-panel settings-panel">
            <div className="section-heading">
              <p className="eyebrow">使い方</p>
              <h2>シンプルなメモ帳です</h2>
            </div>
            <div className="settings-list">
              <article>
                <span>1. メモを書く</span>
                <p>右上の＋、または今日画面のボタンから、思いついたことを短く残します。</p>
              </article>
              <article>
                <span>2. 次の一歩を決める</span>
                <p>必要なら「5分だけ試す」くらいの小さな行動を書いておけます。</p>
              </article>
              <article>
                <span>3. 完了にする</span>
                <p>今日やったことは完了として残せます。あとで見返す時にも便利です。</p>
              </article>
              <article>
                <span>保存について</span>
                <p>メモはこの端末のブラウザ内に保存されます。アカウント登録は不要です。</p>
              </article>
            </div>
          </section>
        ) : null}
      </section>

      <button className="floating-action" type="button" onClick={openRecord} aria-label="メモを書く">＋</button>

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
                <p className="eyebrow">メモ</p>
                <h2 id="record-title">メモを書く</h2>
              </div>
              <button className="sheet-close" type="button" onClick={closeRecord} aria-label="閉じる">×</button>
            </div>
            <FireForm onAddSeed={handleAddSeed} />
          </section>
        </div>
      ) : null}
    </main>
  );
}
