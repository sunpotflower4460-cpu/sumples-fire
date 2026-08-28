import { describe, expect, it } from 'vitest';
import { quadrantDescriptions, quadrantLabels, quadrantShortDescriptions } from './fireSeed';

describe('matrix UX copy', () => {
  it('does not infer task duration from urgency and importance alone', () => {
    expect(quadrantLabels.quickBurn).toBe('先に片付ける');
    expect(quadrantShortDescriptions.quickBurn).toContain('急ぎ');
    expect(quadrantDescriptions.quickBurn).toContain('重要度は低め');
    expect(quadrantDescriptions.quickBurn).not.toContain('短時間');
  });
});
