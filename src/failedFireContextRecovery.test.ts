import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('failed Fire context recovery', () => {
  const hookSource = readFileSync(resolve(__dirname, 'hooks/useFireSeeds.ts'), 'utf-8');
  const appSource = readFileSync(resolve(__dirname, 'App.tsx'), 'utf-8');

  it('publishes an explicit durable completion result for both Fire outcomes', () => {
    expect(hookSource).toContain("type BurnCompletion = {");
    expect(hookSource).toContain("status: 'succeeded' | 'failed';");
    expect(hookSource).toContain('const [burnCompletion, setBurnCompletion] = useState<BurnCompletion | null>(null);');
    expect(hookSource).toContain("setBurnCompletion({ id, status: 'failed' });");
    expect(hookSource).toContain("setBurnCompletion({ id, status: 'succeeded' });");
    expect(hookSource).toContain('burnCompletion,');
  });

  it('returns a failed Fire to the exact unchanged task instead of advancing the queue', () => {
    expect(appSource).toContain('burnCompletion,');
    expect(appSource).toContain("if (burnCompletion?.status !== 'succeeded')");
    expect(appSource).toContain("const failedBurnId = burnCompletion?.status === 'failed' ? burnCompletion.id : null;");
    expect(appSource).toContain('if (failedBurnId && focusTaskButtonById(failedBurnId)) return;');
  });

  it('records completed-origin context only after durable Fire success', () => {
    const failureGateIndex = appSource.indexOf("if (burnCompletion?.status !== 'succeeded')");
    const completedOriginIndex = appSource.indexOf('lastCompletedBurnOriginRef.current = burnOrigin;', failureGateIndex);

    expect(failureGateIndex).toBeGreaterThan(-1);
    expect(completedOriginIndex).toBeGreaterThan(failureGateIndex);
    expect(appSource).toContain('}, [burningTask, burnCompletion]);');
  });

  it('keeps the established successful queue continuation after the success gate', () => {
    const successContextIndex = appSource.indexOf('lastCompletedBurnOriginRef.current = burnOrigin;');
    const queueFocusIndex = appSource.indexOf("burnOrigin?.kind === 'queue' && focusQueuePosition(burnOrigin.index)", successContextIndex);

    expect(successContextIndex).toBeGreaterThan(-1);
    expect(queueFocusIndex).toBeGreaterThan(successContextIndex);
  });
});
