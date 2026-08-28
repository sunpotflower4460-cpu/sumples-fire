import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('single task-creation entry contracts', () => {
  const appSource = readFileSync(resolve(__dirname, 'App.tsx'), 'utf-8');
  const cssSource = readFileSync(resolve(__dirname, 'actionEntryPolish.css'), 'utf-8');
  const mainSource = readFileSync(resolve(__dirname, 'main.tsx'), 'utf-8');

  it('uses contextual Today creation entries instead of simultaneous duplicate buttons', () => {
    expect(appSource).toContain("const shouldShowFloatingAction = activeTab !== 'today' || hasPendingTasks;");
    expect(appSource).toContain('{shouldShowFloatingAction ? (');
    expect(appSource).toContain('最初のタスクを書く');
    expect(appSource).toContain('次の薪をくべる');
    expect(appSource).not.toContain('>タスクを追加</button>');
  });

  it('reserves the focus action row for the Fire action', () => {
    expect(cssSource).toContain('.focus-seed .focus-actions');
    expect(cssSource).toContain('grid-template-columns: minmax(0, 1fr);');
    expect(appSource).toContain('className="focus-actions"');
  });

  it('removes duplicate branding and hidden design-rationale copy from rendered markup', () => {
    const brandKickers = appSource.match(/<p className="app-kicker">Fire Task<\/p>/g) ?? [];
    expect(brandKickers).toHaveLength(1);
    expect(appSource).not.toContain('settings-screen-intro');
    expect(appSource).not.toContain('毎回触るものを手前に、説明は必要な時だけ開けるように整理しています。');
  });

  it('keeps action-entry polish before the final accessibility layer', () => {
    expect(mainSource.indexOf("import './actionEntryPolish.css';"))
      .toBeLessThan(mainSource.indexOf("import './accessibilityPolish.css';"));
  });
});
