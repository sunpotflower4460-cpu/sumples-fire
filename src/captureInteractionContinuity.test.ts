import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('capture and queue interaction continuity', () => {
  const appSource = readFileSync(resolve(__dirname, 'App.tsx'), 'utf-8');
  const cardSource = readFileSync(resolve(__dirname, 'components/FireCard.tsx'), 'utf-8');

  it('moves focus to the newly added task instead of restoring the old launch control', () => {
    expect(appSource).toContain('const closeRecordAfterSubmit = () =>');
    expect(appSource).toContain('previouslyFocusedElementRef.current = null;');
    expect(appSource).toContain('closeRecordAfterSubmit();');
    expect(appSource).toContain('if (focusTaskButtonById(id)) return;');
  });

  it('focuses the first newly revealed queue card after progressive loading', () => {
    expect(appSource).toContain('const focusQueueCardAtIndex = (index: number) =>');
    expect(appSource).toContain('const firstRevealedIndex = visibleQueueTasks.length;');
    expect(appSource).toContain('focusQueueCardAtIndex(firstRevealedIndex)');
    expect(cardSource).toContain('tabIndex={-1}');
  });

  it('requires a single-touch downward-dominant swipe before dismissing capture', () => {
    expect(appSource).toContain('const swipeTouchStartRef = useRef<{ x: number; y: number } | null>(null);');
    expect(appSource).toContain('if (event.touches.length !== 1)');
    expect(appSource).toContain('deltaY > 80 && deltaY > Math.abs(deltaX) * 1.25');
    expect(appSource).toContain('if (isIntentionalDownwardSwipe)');
  });

  it('invalidates interrupted swipe gestures instead of reusing stale coordinates', () => {
    expect(appSource).toContain('const handleSheetSwipeCancel = () =>');
    expect(appSource).toContain('swipeTouchStartRef.current = null;');
    expect(appSource).toContain('onTouchCancel={handleSheetSwipeCancel}');
  });
});
