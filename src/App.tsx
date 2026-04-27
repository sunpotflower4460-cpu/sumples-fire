import { useState } from 'react';
import { FireCard } from './components/FireCard';
import { FireFilters } from './components/FireFilters';
import { FireForm } from './components/FireForm';
import { FireStats } from './components/FireStats';
import { useFireSeeds } from './hooks/useFireSeeds';
import type { FireCategory, FirePriority, FireStage } from './types/fireSeed';
import { categoryLabels, priorityLabels, stageLabels } from './types/fireSeed';

type AppTab = 'today' | 'seeds' | 'record' | 'info';

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
  { id: 'seeds', label: '火種', icon: '芽' },
  { id: 'record', label: '記録', icon: '記' },
  { id: 'info', label: '情報', icon: 'i' },
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

  const openRecordTab = () => setActiveTab('record');
  const handleAddSeed = (input: NewFireSeedInput) => {
    addSeed(input);
    setActiveTab('seeds');
  };

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
              <p className="eyebrow">今日の火種</p>
              <h2>{focusSeed?.title ?? '今日の火種を置いてみよう'}</h2>
              <p>{focusSeed?.nextAction || 'まずは小さなひらめきをひとつ、火種として残してみましょう。'}</p>
              <button className="primary-button" type="button" onClick={openRecordTab}>火種を記録する</button>
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

            <FireStats stats={stats} />
          </div>
        ) : null}

        {activeTab === 'seeds' ? (
          <section className="panel app-panel">
            <div className="list-header compact">
              <div className="section-heading">
                <p className="eyebrow">火種一覧</p>
                <h2>育てている火種</h2>
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
                  <span>記録タブから新しいひらめきを置いてみましょう。</span>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {activeTab === 'record' ? (
          <section className="panel app-panel">
            <div className="section-heading">
              <p className="eyebrow">記録</p>
              <h2>火種を残す</h2>
            </div>
            <FireForm onAddSeed={handleAddSeed} />
          </section>
        ) : null}

        {activeTab === 'info' ? (
          <section className="panel app-panel settings-panel">
            <div className="section-heading">
              <p className="eyebrow">このアプリについて</p>
              <h2>安心して使うために</h2>
            </div>
            <div className="settings-list">
              <article>
                <span>端末内保存</span>
                <p>記録した火種は、この端末のブラウザ内に保存されます。アカウント登録は不要です。</p>
              </article>
              <article>
                <span>気軽に残す</span>
                <p>完成していない考えでも大丈夫です。小さな一歩だけ決めて、あとから育てられます。</p>
              </article>
              <article>
                <span>ホーム画面から使う</span>
                <p>ブラウザの共有メニューからホーム画面に追加すると、よりアプリに近い感覚で開けます。</p>
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
            aria-current={activeTab === tab.id ? 'page' : undefined}
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
