import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('rank progress semantics', () => {
  const source = readFileSync(resolve(__dirname, 'components/FireStats.tsx'), 'utf-8');

  it('pairs the numeric percentage with the human meaning of the next rank', () => {
    expect(source).toContain('const rankProgressPercent = Math.round(stats.rankProgress);');
    expect(source).toContain('const rankProgressText = `${rankProgressPercent}%。${rankMessage}`;');
    expect(source).toContain('aria-valuenow={rankProgressPercent}');
    expect(source).toContain('aria-valuetext={rankProgressText}');
  });

  it('keeps the same normalized percentage in visible and semantic progress', () => {
    expect(source).toContain('aria-valuemin={0}');
    expect(source).toContain('aria-valuemax={100}');
    expect(source).toContain('<span className="rank-progress-value" aria-hidden="true">{rankProgressPercent}%</span>');
  });

  it('covers both an upcoming rank and the terminal rank state', () => {
    expect(source).toContain('次の称号「${stats.nextRank}」まであと${stats.nextRankRemaining}炭');
    expect(source).toContain('最高称号に到達しています');
  });
});
