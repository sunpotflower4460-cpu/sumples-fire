import { FireCard } from './components/FireCard';
import { FireFilters } from './components/FireFilters';
import { FireForm } from './components/FireForm';
import { FireStats } from './components/FireStats';
import { useFireSeeds } from './hooks/useFireSeeds';

export default function App() {
  const { addSeed, deleteSeed, filter, filteredSeeds, resetSamples, setFilter, stats, toggleSeed } = useFireSeeds();

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="app-kicker">Sumples Fire</p>
          <h1>小さなアイデアを育てる。</h1>
          <p>思いつき、タスク、音楽の断片、暮らしのメモを保存するミニWebアプリです。</p>
        </div>
        <div className="hero-orb" aria-hidden="true">
          <span>火</span>
        </div>
      </section>

      <FireStats stats={stats} />

      <div className="content-grid">
        <aside className="panel form-panel">
          <div className="section-heading">
            <p className="eyebrow">New Seed</p>
            <h2>メモを足す</h2>
          </div>
          <FireForm onAddSeed={addSeed} />
        </aside>

        <section className="panel list-panel">
          <div className="list-header">
            <div className="section-heading">
              <p className="eyebrow">Seed List</p>
              <h2>今あるメモ</h2>
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
                <p>この条件のメモはまだありません。</p>
                <span>新しいひらめきを置いてみましょう。</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
