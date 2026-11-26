import { useEffect, useId, useRef, useState } from 'react';
import { COPY } from '../plusCopy';
import { plusStore } from '../plusStore';
import type { PlusRoute } from '../plusStore';
import { usePlus } from '../usePlus';
import { FlameGlyph } from './FlameGlyph';
import { PlusDialog } from './PlusDialog';
import { PurchaseButton, PurchaseStatus } from './PurchaseStatus';
import { getFlame } from '../flames';
import type { FlameId } from '../flames';

const BENEFITS: { route: PlusRoute; title: string; body: string }[] = [
  { route: 'flames', title: COPY.benefitFlameTitle, body: COPY.benefitFlameBody },
  { route: 'scene', title: COPY.benefitSceneTitle, body: COPY.benefitSceneBody },
  { route: 'monthly', title: COPY.benefitHistoryTitle, body: COPY.benefitHistoryBody },
];

/** Where the Plus screens can be entered once the person owns Plus. */
export const PLUS_ENTRIES: { route: PlusRoute; label: string }[] = [
  { route: 'flames', label: '炎を選ぶ' },
  { route: 'scene', label: '焚き火を整える' },
  { route: 'monthly', label: '月別ふりかえり' },
];

export function PlusIntroScreen() {
  const { state, entitled } = usePlus();
  const headingId = useId();
  const thanksRef = useRef<HTMLHeadingElement | null>(null);
  const [applyError, setApplyError] = useState(false);
  const { store } = state;
  const showThanks = entitled && store.justPurchased;

  // The sheet changes into the thank-you view when a purchase succeeds. Move
  // focus there so VoiceOver users land on the news, not on a removed button.
  useEffect(() => {
    if (showThanks) thanksRef.current?.focus();
  }, [showThanks]);

  const previewFlameId: FlameId = state.flameDraft?.flameMode === 'fixed'
    ? state.flameDraft.fixedFlame
    : state.flameDraft?.favoriteFlames[0] ?? 'normal';
  const previewFlame = getFlame(previewFlameId);

  const canGoBack = state.routeStack.length > 1;

  const applyChosen = async () => {
    setApplyError(false);
    const { flameDraft, sceneDraft, preferences } = plusStore.getState();
    if (!flameDraft && !sceneDraft) {
      plusStore.acknowledgePurchase();
      plusStore.openScreen('flames');
      return;
    }
    const merged = {
      ...preferences,
      ...(flameDraft
        ? { flameMode: flameDraft.flameMode, fixedFlame: flameDraft.fixedFlame, favoriteFlames: flameDraft.favoriteFlames }
        : {}),
      ...(sceneDraft ? { scene: sceneDraft.scene, mix: sceneDraft.mix } : {}),
    };
    const result = await plusStore.savePreferences(merged);
    if (result.ok) {
      plusStore.acknowledgePurchase();
      plusStore.closeAll();
    } else {
      setApplyError(true);
    }
  };

  return (
    <PlusDialog
      titleId={headingId}
      title={COPY.name}
      screen="intro"
      canGoBack={canGoBack}
      onBack={() => plusStore.closeScreen()}
      onClose={() => plusStore.closeAll()}
    >
      {showThanks ? (
        <div className="plus-thanks">
          <div className="plus-hero-flame"><FlameGlyph spectacle={previewFlame} size={64} /></div>
          <h3 ref={thanksRef} tabIndex={-1} className="plus-hero-title">{COPY.thanks}</h3>
          <p className="plus-lead">{COPY.next}</p>
          <div className="plus-actions">
            <button type="button" className="plus-primary" onClick={() => void applyChosen()}>
              {COPY.setSelected}
            </button>
            <p className="plus-status is-error" role="status" aria-live="polite">
              {applyError ? COPY.saveFailed : ''}
            </p>
            <button
              type="button"
              className="plus-secondary"
              onClick={() => {
                plusStore.acknowledgePurchase();
                plusStore.closeAll();
              }}
            >
              {COPY.finish}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="plus-kicker">いつもの Fire を、あなた好みに。</p>
          <div className="plus-hero-flame"><FlameGlyph spectacle={previewFlame} size={64} /></div>
          <h3 className="plus-hero-title">{COPY.headline}</h3>
          <p className="plus-lead">{COPY.description}</p>

          <p className="plus-help">特典をタップして、{entitled ? '開きます' : '試してみる'}。</p>
          <ol className="plus-benefits">
            {BENEFITS.map((benefit, index) => (
              <li key={benefit.route}>
                <button
                  type="button"
                  className="plus-benefit"
                  onClick={() => plusStore.openScreen(benefit.route)}
                  aria-label={`${benefit.title}。${benefit.body}${entitled ? '' : ` ${COPY.tryIt}`}`}
                >
                  <span className="plus-benefit-index" aria-hidden="true">{index + 1}</span>
                  <span className="plus-benefit-copy">
                    <strong>{benefit.title}</strong>
                    <span>{benefit.body}</span>
                  </span>
                  <span className="plus-benefit-cta" aria-hidden="true">{entitled ? '開く' : COPY.tryIt}</span>
                </button>
              </li>
            ))}
          </ol>

          <p className="plus-help">月別ふりかえりは、{COPY.historyAvailable}</p>

          <div className="plus-purchase-area">
            {entitled ? (
              <p className="plus-owned" role="status">
                <span className="plus-badge">{COPY.purchased}</span>
                <span>Plusをお使いいただけます。</span>
              </p>
            ) : (
              <>
                <PurchaseButton store={store} />
                <p className="plus-one-time">{COPY.oneTime}</p>
                <p className="plus-fineprint">{COPY.freeRemains}</p>
              </>
            )}
            <PurchaseStatus store={store} />
            <button type="button" className="plus-link" onClick={() => plusStore.closeAll()}>
              {entitled ? COPY.close : COPY.later}
            </button>
          </div>
        </>
      )}
    </PlusDialog>
  );
}
