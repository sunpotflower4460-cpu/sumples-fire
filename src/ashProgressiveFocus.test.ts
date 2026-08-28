import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('progressive ash history focus continuity', () => {
  const source = readFileSync(resolve(__dirname, 'components/AshLegacy.tsx'), 'utf-8');

  it('moves into the first newly revealed record after loading more history', () => {
    expect(source).toContain('const firstRevealedIndex = visibleRecords.length;');
    expect(source).toContain('`[data-ash-record-index="${firstRevealedIndex}"]`');
    expect(source).toContain('firstRevealedRecord?.focus({ preventScroll: true });');
    expect(source).toContain("firstRevealedRecord?.scrollIntoView({ block: 'nearest', behavior: 'auto' });");
  });

  it('makes record containers programmatically focusable without adding Tab stops', () => {
    expect(source).toContain('tabIndex={-1}');
    expect(source).toContain('data-ash-record-index={index}');
    expect(source).toContain('visibleRecords.map((seed, index) =>');
  });

  it('keeps collapse behavior quiet and leaves focus on the persistent toggle', () => {
    const loadMoreIndex = source.indexOf('if (remainingRecordCount > 0)');
    const collapseIndex = source.indexOf('setVisibleRecordCount(RECORD_PAGE_SIZE);');
    const focusIndex = source.indexOf('firstRevealedRecord?.focus');

    expect(loadMoreIndex).toBeGreaterThan(-1);
    expect(focusIndex).toBeGreaterThan(loadMoreIndex);
    expect(collapseIndex).toBeGreaterThan(focusIndex);
  });
});
