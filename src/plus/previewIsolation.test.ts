import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(__dirname, path), 'utf-8');
/** Source with comments removed, so explanations of a rule never trip the rule. */
const code = (path: string) => read(path).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('試し見 (preview) is isolated from real records', () => {
  const preview = code('ui/useFlamePreview.tsx');

  it('never imports anything that could create a real Fire or touch records', () => {
    for (const forbidden of [
      'useFireSeeds',
      'fireSeedStorage',
      'fireStreak',
      'fireBurnUndo',
      'burnTask',
      'saveStoredSeeds',
      'recordRealFlame',
      'plusStore',
      'appStorage',
    ]) {
      expect(preview, forbidden).not.toContain(forbidden);
    }
  });

  it('draws a sample sheet of paper worth zero ash and tells the ritual it is a preview', () => {
    expect(preview).toContain('ashPoints: 0');
    expect(preview).toContain('preview seed={SAMPLE_SEED}');
  });

  it('the ritual shows no reward for a preview', () => {
    const ritual = read('../components/BurningRitual.tsx');
    expect(ritual).toContain('preview ? (');
    expect(ritual).toContain('試し見では、タスクや炭の記録は変わりません。');
  });

  it('real Fires record the flame for favourites; previews do not', () => {
    const fireHook = read('../hooks/useFireSeeds.ts');
    expect(fireHook).toContain('plusStore.recordRealFlame(spectacle.type)');
    const uiSources = readdirSync(resolve(__dirname, 'ui')).map((name) => code(`ui/${name}`)).join('\n');
    expect(uiSources).not.toContain('recordRealFlame');
  });

  it('the picker, scene editor and monthly screen never call burnTask or write seeds', () => {
    for (const name of ['FlamePickerScreen.tsx', 'SceneEditorScreen.tsx', 'MonthlyScreen.tsx', 'PlusIntroScreen.tsx']) {
      const source = code(`ui/${name}`);
      expect(source, name).not.toContain('burnTask');
      expect(source, name).not.toContain('saveStoredSeeds');
      expect(source, name).not.toContain('saveFireStreak');
    }
  });
});

describe('Plus never raises the free experience\'s ceiling or floor', () => {
  it('resolveBurnSpectacle is the only place a flame is chosen, and ash is computed elsewhere', () => {
    const choice = read('flameChoice.ts');
    expect(choice).not.toContain('ashPoints');
    expect(choice).not.toContain('streak =');
  });

  it('ash points still come from the task difficulty, not the flame', () => {
    const model = read('../lib/fireSeedModel.ts');
    expect(model).toContain('ashPoints: seed.ashPoints || difficultyAshPoints[seed.difficulty]');
    expect(model).not.toContain('spectacle');
  });
});
