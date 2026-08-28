import { useMemo, useState } from 'react';
import { sortAshRecordsOldestFirst } from '../lib/ashHistory';
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
const RECORD_PAGE_SIZE = 12;

function DeleteGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7h14" />
      <path d="M9 7V4.8h6V7" />
      <path d="M7.5 7l.7 12h7.6l.7-12" />
      <path d="M10 10.5v5" />
      <path d="M14 10.5v5" />
    </svg>
  );
}

export function AshLegacy({ seeds, onDelete }: AshLegacyProps) {
  const [visibleRecordCount, setVisibleRecordCount] = useState(RECORD_PAGE_SIZE);
  const totalAsh = seeds.reduce((sum, seed) => sum + seed.ashPoints, 0);
  const chronologicalSeeds = useMemo(() => sortAshRecordsOldestFirst(seeds), [seeds]);
  const newestFirstSeeds = useMemo(() => [...chronologicalSeeds].reverse(), [chronologicalSeeds]);
  const mosaicTiles = chronologicalSeeds.slice(-MAX_MOSAIC_TILES);
  const newestId = chronologicalSeeds[chronologicalSeeds.length - 1]?.id;
  const visibleRecords = newestFirstSeeds.slice(0, visibleRecordCount);
  const remainingRecordCount = Math.max(0, newestFirstSeeds.length - visibleRecords.length);
  const hasExpandedRecords = visibleRecordCount > RECORD_PAGE_SIZE;

  const handleRecordPage = () => {
    if (remainingRecordCount > 0) {
      setVisibleRecordCount((current) => Math.min(current + RECORD_PAGE_SIZE, newestFirstSeeds.length));
      return;
    }
    setVisibleRecordCount(RECORD_PAGE_SIZE);
  };

  if (seeds.length === 0) {
    return (
      <div className="ash-legacy-panel ash-legacy-empty">
        <section className="ash-empty-state" aria-labelledby="ash-empty-title">
          <div className="ash-empty-mark" aria-hidden="true">
            <span />
          </div>
          <p className="eyebrow">NO ASH YET</p>
          <h3 id="ash-empty-title">最初の炭は、まだありません。</h3>
          <p>タスクをひとつ終えてFireすると、ここに燃やした記録が残ります。</p>
          <small>記録は新しい順に残り、積み上がった炭もここで確認できます。</small>
        </section>
      </div>
    );
  }

  return (
    <div className="ash-legacy-panel">
      <div className="ash-legacy-header">
        <p className="ash-legacy-total-label">積み上がった炭</p>
        <div className="ash-legacy-total-points" aria-label={`合計${totalAsh}炭`}>
          {totalAsh}
        </div>
        <p className="ash-legacy-count">{seeds.length}個のタスクを燃やしてきました</p>
      </div>

      <div className="ash-charcoal-mosaic" aria-hidden="true">
        <p className="ash-mosaic-label">炭の紋様</p>
        <div className="ash-mosaic-grid">
          {mosaicTiles.map((seed) => (
            <div
              key={seed.id}
              className={`ash-coal-tile coal-${seed.difficulty}${seed.id === newestId ? ' is-newest' : ''}`}
            />
          ))}
        </div>
      </div>

      <section className="ash-records-section" aria-labelledby="ash-records-heading">
        <div className="ash-records-heading">
          <div>
            <p className="eyebrow">BURN HISTORY</p>
            <h3 id="ash-records-heading">燃やした記録</h3>
          </div>
          <span aria-hidden="true">{visibleRecords.length} / {newestFirstSeeds.length}件</span>
        </div>

        <div id="ash-records-list" className="ash-records-list" role="list" aria-label="燃やしたタスクの一覧">
          {visibleRecords.map((seed) => {
            const burnedDate = seed.burnedAt
              ? dateFormatter.format(new Date(seed.burnedAt))
              : null;
            return (
              <div key={seed.id} className={`ash-record-card is-${seed.difficulty}`} role="listitem">
                <div className="ash-record-main">
                  <p className="ash-record-title">{seed.title}</p>
                  <div className="ash-record-meta">
                    <span className="ash-record-points">+{seed.ashPoints}炭</span>
                    <span className="ash-record-difficulty">{difficultyLabels[seed.difficulty]}</span>
                    {seed.burnedAt && burnedDate ? (
                      <time className="ash-record-date" dateTime={seed.burnedAt}>{burnedDate}</time>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  className="ash-record-delete"
                  onClick={() => onDelete(seed.id)}
                  aria-label={`「${seed.title}」を削除`}
                >
                  <DeleteGlyph />
                </button>
              </div>
            );
          })}
        </div>

        {newestFirstSeeds.length > RECORD_PAGE_SIZE ? (
          <button
            type="button"
            className="ash-records-toggle"
            aria-expanded={hasExpandedRecords}
            aria-controls="ash-records-list"
            onClick={handleRecordPage}
          >
            {remainingRecordCount > 0
              ? `次の${Math.min(RECORD_PAGE_SIZE, remainingRecordCount)}件を見る（残り${remainingRecordCount}件）`
              : `最新${RECORD_PAGE_SIZE}件に戻す`}
          </button>
        ) : null}
      </section>
    </div>
  );
}
