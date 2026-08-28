import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('decision clarity UI contracts', () => {
  const appSource = readFileSync(resolve(__dirname, 'App.tsx'), 'utf-8');
  const cardSource = readFileSync(resolve(__dirname, 'components/FireCard.tsx'), 'utf-8');
  const settingsSource = readFileSync(resolve(__dirname, 'components/FireSettingsPanel.tsx'), 'utf-8');

  it('uses the four-quadrant matrix as the single task filtering model', () => {
    expect(appSource).not.toContain('FireFilters');
    expect(appSource).not.toContain('TodayFireFilter');
    expect(appSource).not.toContain('filteredSeeds');
    expect(appSource).toContain('className="matrix-filter-shell"');
    expect(appSource).toContain('current === key ? null : key');
  });

  it('does not repeat derived priority or progression inside primary Fire actions', () => {
    expect(appSource).not.toContain('priorityLabels');
    expect(appSource).not.toContain('rank-chip');
    expect(cardSource).not.toContain('priorityLabels');
    expect(cardSource).not.toContain('stageLabels');
    expect(cardSource).not.toContain('levelLabels');
  });

  it('only exposes card disclosure when there is an actual memo to reveal', () => {
    expect(cardSource).toContain('{seed.body ? (');
    expect(cardSource).toContain('<summary>メモを見る</summary>');
    expect(cardSource).not.toContain('card-detail-list');
  });

  it('keeps platform-dependent text glyphs out of primary controls', () => {
    expect(appSource).not.toContain('>＋<');
    expect(appSource).not.toContain('>×<');
    expect(appSource).not.toContain('🪵');
    expect(settingsSource).not.toContain('>›<');
  });
});
