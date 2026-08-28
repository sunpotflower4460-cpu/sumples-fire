import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('new seed creation boundary', () => {
  const source = readFileSync(resolve(__dirname, 'useFireSeeds.ts'), 'utf-8');

  it('derives priority and forces new tasks to start unburned', () => {
    expect(source).toContain('const priority = derivePriority(input.urgency, input.importance)');
    expect(source).toContain('priority,');
    expect(source).toContain("stage: 'spark'");
    expect(source).toContain('burned: false');
    expect(source).toContain('completed: false');
  });

  it('uses the contradiction-free NewFireSeedInput type', () => {
    expect(source).toContain('FireSeed, NewFireSeedInput');
    expect(source).not.toContain('priority: FirePriority');
    expect(source).not.toContain('stage: FireStage');
  });
});
