import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('task card semantic context', () => {
  const source = readFileSync(resolve(__dirname, 'components/FireCard.tsx'), 'utf-8');

  it('labels every article with its visible task title', () => {
    expect(source).toContain('const titleId = `fire-card-${seed.id}-title`');
    expect(source).toContain('aria-labelledby={titleId}');
    expect(source).toContain('<h3 id={titleId}>{jp(seed.title)}</h3>');
  });

  it('keeps repeated memo disclosures tied to the exact task', () => {
    expect(source).toContain('aria-label={`「${seed.title}」のメモを見る`}');
    expect(source).toContain('>メモを見る</summary>');
  });

  it('keeps destructive and completion actions task-specific too', () => {
    expect(source).toContain('aria-label={`「${seed.title}」を完了してFire`}');
    expect(source).toContain('aria-label={`「${seed.title}」を削除`}');
  });
});
