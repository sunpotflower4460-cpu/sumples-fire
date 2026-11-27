import { lazy, Suspense, useId } from 'react';
import { COPY } from '../plusCopy';
import { plusStore } from '../plusStore';
import { PlusDialog } from './PlusDialog';

const Showcase = lazy(() => import('../guide/Showcase'));

export function PlusGuideScreen({ canGoBack }: { canGoBack: boolean }) {
  const headingId = useId();
  return (
    <PlusDialog titleId={headingId} title={COPY.guideTitle} screen="guide" canGoBack={canGoBack}
      onBack={() => plusStore.closeScreen()} onClose={() => plusStore.closeAll()}>
      <Suspense fallback={<p className="plus-help" role="status">紹介を読み込んでいます。</p>}>
        <Showcase embedded />
      </Suspense>
    </PlusDialog>
  );
}
