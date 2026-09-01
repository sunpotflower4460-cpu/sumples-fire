import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('humane motivation contracts', () => {
  const streakSource = readFileSync(resolve(__dirname, 'lib/fireStreak.ts'), 'utf-8');
  const campfireSource = readFileSync(resolve(__dirname, 'components/FireCampfire.tsx'), 'utf-8');

  it('uses autonomy-supportive prompts instead of pressure or shame', () => {
    expect(streakSource).toContain('急がなくていい。ひとつ選ぼう。');
    expect(streakSource).toContain('今日の火は、自分のペースで。');
    expect(streakSource).toContain('余力がある分だけ、進めよう。');
    expect(streakSource).not.toContain('立ち止まるな');
    expect(streakSource).not.toContain('燃やして証明しろ');
    expect(streakSource).not.toContain('また見たくないか');
  });

  it('does not announce static daily encouragement as a live update', () => {
    expect(campfireSource).toContain('<p className="campfire-craving-copy">{jp(cravingCopy)}</p>');
    expect(campfireSource).not.toContain('className="campfire-craving-copy" aria-live');
  });
});
