import { useMemo } from 'react';
import type { FireSeed } from '../types/fireSeed';
import { difficultyLabels } from '../types/fireSeed';

type AshLegacyProps = {
  seeds: FireSeed[];
  onDelete: (id: string) => void;
};

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const MAX_MOSAIC_TILES = 80;

export function AshLegacy({ seeds, onDelete }: AshLegacyProps) {
  const totalAsh = seeds.reduce((sum, seed) => sum + seed.ashPoints, 0);
  const mosaicTiles = seeds.slice(-MAX_MOSAIC_TILES);
  const newestId = seeds[seeds.length - 1]?.id;
  const reversedSeeds = useMemo(() => [...seeds].reverse(), [seeds]);

  return (
    <div className="ash-legacy-panel">

      {/* ── Overview header ── */}
      <div className="ash-legacy-header">
        <p className="ash-legacy-total-label">炭の遺産</p>
        <div
          className="ash-legacy-total-points"
          aria-label={`合計${totalAsh}炭`}
        >
          {totalAsh}
        </div>
        <p className="ash-legacy-count">{seeds.length}個のタスクが炭になった</p>
      </div>

      {/* ── Charcoal mosaic ── */}
      <div className="ash-charcoal-mosaic" aria-hidden="true">
        <p className="ash-mosaic-label">炭の紋様</p>
        {seeds.length > 0 ? (
          <div className="ash-mosaic-grid">
            {mosaicTiles.map((seed) => (
              <div
                key={seed.id}
                className={`ash-coal-tile coal-${seed.difficulty}${seed.id === newestId ? ' is-newest' : ''}`}
                title={seed.title}
              />
            ))}
          </div>
        ) : (
          <p className="ash-mosaic-empty">まだ炭はありません。タスクをFireすると、ここに紋様が積み上がります。</p>
        )}
      </div>

      {/* ── Compact ash records (newest first) ── */}
      {seeds.length > 0 ? (
        <div className="ash-records-list" role="list" aria-label="燃やしたタスクの一覧">
          {reversedSeeds.map((seed) => {
            const burnedDate = seed.burnedAt
              ? dateFormatter.format(new Date(seed.burnedAt))
              : null;
            return (
              <div
                key={seed.id}
                className={`ash-record-card is-${seed.difficulty}`}
                role="listitem"
              >
                <div className="ash-record-main">
                  <p className="ash-record-title">{seed.title}</p>
                  <div className="ash-record-meta">
                    <span className="ash-record-points">+{seed.ashPoints}炭</span>
                    <span className="ash-record-difficulty">{difficultyLabels[seed.difficulty]}</span>
                    {burnedDate ? (
                      <span className="ash-record-date">{burnedDate}</span>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  className="ash-record-delete"
                  onClick={() => onDelete(seed.id)}
                  aria-label={`「${seed.title}」を削除`}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
