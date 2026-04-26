import { useState } from 'react';
import { FireCard } from './components/FireCard';
import { FireFilters } from './components/FireFilters';
import { FireForm } from './components/FireForm';
import { FireStats } from './components/FireStats';
import { useFireSeeds } from './hooks/useFireSeeds';
import { categoryLabels, priorityLabels, stageLabels } from './types/fireSeed';

type AppTab = 'today' | 'seeds' | 'add' | 'settings';

const tabs: { id: AppTab; label: string; icon: string }[] = [
  { id: 'today', label: '今日', icon: '🔥' },
  { id: 'seeds', label: '火種', icon: '🌱' },
  { id: 'add', label: '追加', icon: '＋' },
  { id: 'settings', label: '設定', icon: '⚙︎' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const {
    addSeed,
    deleteSeed,
    filter,
    filteredSeeds,
    focusSeed,
    notice,
    resetSamples,
    setFilter,
    stats,
    toggleSeed,
  } = useFireSeeds();

  const openAddTab = () => setActiveTab('add');

  return (
    <main className="mobile-app-shell">
      <header className="app-topbar">
        <div>
          <p className="app-kicker">Sumples Fire</p>
          <h1>{tabs.find((tab) => tab.id === activeTab)?.label}</h1>
        </div>
        <div className="app-icon" aria-hidden="true">火</div>
      </header>

      {notice ? <div className="toast" role="status">{notice}</div> : null}

      <section className="app-screen" aria-live="polite">
        {activeTab === 'today' ? (
          <div className="screen-stack">
            <section className="today-hero">
              <p className="eyebrow">Today&apos;s Spark</p>
              <h2>{focusSeed?.title ?? '今日の火種を置いてみよう'}</h2>
              <p>{focusSeed?.nextAction || 'まずは小さなひらめきをひとつ、火種として残してみましょう。'}</p>
              <button className="primary-button" type="button" onClick={openAddTab}>新しい火種を追加</button>
            </section>

            {focusSeed ? (
              <section className="quick-card">
                <div>
                  <span>{categoryLabels[focusSeed.category]}</span>
                  <strong>{priorityLabels[focusSeed.priority]}</strong>
                  <small>{stageLabels[focusSeed.stage]}</small>
                </div>
                <button className="ghost-button" type="button" onClick={() => toggleSeed(focusSeed.id)}>炎にする</button>
              </section>
            ) : null}

            <FireStats stats={stats} />
          </div>
        ) : null}

        {activeTab === 'seeds' ? (
          <section className="panel app-panel">
            <div className="list-header compact">
              <div className="section-heading">
                <p className="eyebrow">Seed List</p>
                <h2>火種一覧</h2>
              </div>
              <button className="ghost-button" type="button" onClick={resetSamples}>サンプル</button>
            </div>

            <FireFilters filter={filter} onChangeFilter={setFilter} />

            <div className="cards-stack">
              {filteredSeeds.length > 0 ? (
                filteredSeeds.map((seed) => (
                  <FireCard key={seed.id} seed={seed} onToggle={toggleSeed} onDelete={deleteSeed} />
                ))
              ) : (
                <div className="empty-state">
                  <p>この条件の火種はまだありません。</p>
                  <span>追加タブから新しいひらめきを置いてみましょう。</span>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {activeTab === 'add' ? (
          <section className="panel app-panel">
            <div className="section-heading">
              <p className="eyebrow">New Seed</p>
              <h2>火種を足す</h2>
            </div>
            <FireForm onAddSeed={addSeed} />
          </section>
        ) : null}

        {activeTab === 'settings' ? (
          <section className="panel app-panel settings-panel">
            <div className="section-heading">
              <p className="eyebrow">Settings</p>
              <h2>アプリ情報</h2>
            </div>
            <div className="settings-list">
              <article>
                <span>保存場所</span>
                <p>この端末のブラウザ内だけに保存します。外部APIやDBには接続していません。</p>
              </article>
              <article>
                <span>PWA準備</span>
                <p>ホーム画面追加やCapacitor化を見据えた基本メタ情報を設定済みです。</p>
              </article>
              <article>
                <span>次の手動ゲート</span>
                <p>正式アイコン、Apple Developer、Xcode、TestFlight、App Store Connectは手動確認が必要です。</p>
              </article>
            </div>
          </section>
        ) : null}
      </section>

      <nav className="bottom-tabs" aria-label="アプリの画面切り替え">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'tab-button is-active' : 'tab-button'}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </main>
  );
}
