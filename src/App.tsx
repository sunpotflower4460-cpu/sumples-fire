import { FireCard } from './components/FireCard';
import { FireFilters } from './components/FireFilters';
import { FireForm } from './components/FireForm';
import { FireStats } from './components/FireStats';
import { useFireSeeds } from './hooks/useFireSeeds';
import { categoryLabels, priorityLabels, stageLabels } from './types/fireSeed';

export default function App() {
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

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="app-kicker">Sumples Fire</p>
          <h1>小さな火種を、今日の一歩にする。</h1>
          <p>
            思いつき、タスク、音楽の断片、暮らしのメモ。まだ小さなものを、
            次の一歩まで育てるためのミニWebアプリです。
          </p>
        </div>
        <div className="hero-orb" aria-hidden="true">
          <span>火</span>
        </div>
      </section>

      {notice ? <div className="toast" role="status">{notice}</div> : null}

      <FireStats stats={stats} />

      {focusSeed ? (
        <section className="focus-panel" aria-label="今日の火種">
          <div>
            <p className="eyebrow">Today&apos;s Spark</p>
            <h2>{focusSeed.title}</h2>
            <p>{focusSeed.nextAction || 'まずは1分だけ、この火種に触れてみましょう。'}</p>
          </div>
          <div className="focus-meta">
            <span>{categoryLabels[focusSeed.category]}</span>
            <span>{priorityLabels[focusSeed.priority]}</span>
            <span>{stageLabels[focusSeed.stage]}</span>
          </div>
        </section>
      ) : null}

      <div className="content-grid">
        <aside className="panel form-panel">
          <div className="section-heading">
            <p className="eyebrow">New Seed</p>
            <h2>火種を足す</h2>
          </div>
          <FireForm onAddSeed={addSeed} />
        </aside>

        <section className="panel list-panel">
          <div className="list-header">
            <div className="section-heading">
              <p className="eyebrow">Seed List</p>
              <h2>今ある火種</h2>
            </div>
            <button className="ghost-button" type="button" onClick={resetSamples}>サンプルに戻す</button>
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
                <span>新しいひらめきを置いてみましょう。</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
