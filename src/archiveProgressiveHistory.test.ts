import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('progressive ash history', () => {
  const source = readFileSync(resolve(__dirname, 'components/AshLegacy.tsx'), 'utf-8');

  it('renders history in bounded pages instead of all records at once', () => {
    expect(source).toContain('const RECORD_PAGE_SIZE = 12');
    expect(source).toContain('useState(RECORD_PAGE_SIZE)');
    expect(source).toContain('newestFirstSeeds.slice(0, visibleRecordCount)');
    expect(source).toContain('Math.min(current + RECORD_PAGE_SIZE, newestFirstSeeds.length)');
    expect(source).not.toContain('showAllRecords ? newestFirstSeeds');
  });

  it('shows visible progress and exposes the same summary to assistive technology', () => {
    expect(source).toContain('{visibleRecords.length} / {newestFirstSeeds.length}件');
    expect(source).toContain('aria-hidden="true">{visibleRecords.length} / {newestFirstSeeds.length}件');
    expect(source).toContain('className="sr-only">表示中{visibleRecords.length}件、全{newestFirstSeeds.length}件');
    expect(source).toContain('Math.min(RECORD_PAGE_SIZE, remainingRecordCount)');
    expect(source).toContain('最新${RECORD_PAGE_SIZE}件に戻す');
    expect(source).toContain('aria-controls="ash-records-list"');
  });

  it('uses semantic time markup for burn timestamps', () => {
    expect(source).toContain('<time className="ash-record-date" dateTime={seed.burnedAt}>{burnedDate}</time>');
  });
});
