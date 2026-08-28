import { describe, expect, it } from 'vitest';
import { derivePriority, normalizeSeed } from './fireSeedModel';

describe('derived task priority', () => {
  it('maps urgency and importance to a single consistent priority', () => {
    expect(derivePriority('high', 'high')).toBe('high');
    expect(derivePriority('high', 'low')).toBe('high');
    expect(derivePriority('low', 'high')).toBe('medium');
    expect(derivePriority('low', 'low')).toBe('low');
  });

  it('uses the same derivation when normalizing data without an explicit priority', () => {
    expect(normalizeSeed({ title: '大事だけど急がない', urgency: 'low', importance: 'high' }, 0).priority).toBe('medium');
    expect(normalizeSeed({ title: 'あとで', urgency: 'low', importance: 'low' }, 1).priority).toBe('low');
  });
});
