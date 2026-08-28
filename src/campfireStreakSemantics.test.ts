import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('campfire streak summary semantics', () => {
  const source = readFileSync(resolve(__dirname, 'components/FireCampfire.tsx'), 'utf-8');

  it('uses explicit text instead of a generic container aria-label for the streak', () => {
    expect(source).toContain('className="sr-only"');
    expect(source).toContain('連続燃焼{streakData.currentStreak}日');
    expect(source).not.toContain('aria-label={`連続燃焼${streakData.currentStreak}日`}');
  });

  it('includes the same momentum badge meaning that sighted users see', () => {
    expect(source).toContain('const streakMomentumLabel =');
    expect(source).toContain("? '業火'");
    expect(source).toContain("? '勢い'");
    expect(source).toContain("? '加熱中'");
    expect(source).toContain("{streakMomentumLabel ? `、${streakMomentumLabel}` : ''}");
    expect(source).toContain('{streakMomentumLabel}');
  });

  it('marks duplicated visual streak text as presentation-only', () => {
    expect(source).toContain('className="streak-count" aria-hidden="true"');
    expect(source).toContain('className="streak-label" aria-hidden="true"');
    expect(source).toContain('className="streak-momentum-badge" aria-hidden="true"');
  });
});
