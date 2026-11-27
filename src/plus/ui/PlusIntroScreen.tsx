import { useEffect, useId, useRef, useState } from 'react';
import { CombustionFlame } from '../../components/CombustionFlame';
import { applyCampfirePreset } from '../campfireSets';
import { COPY } from '../plusCopy';
import { sceneSettingsOf } from '../plusPreferences';
import { plusStore } from '../plusStore';
import type { PlusRoute } from '../plusStore';
import { usePlus } from '../usePlus';
import { PlusDialog } from './PlusDialog';
import { PurchaseButton, PurchaseStatus } from './PurchaseStatus';
import type { FlameId } from '../flames';
import { SCENES } from '../scenes';

const BENEFITS: { route: PlusRoute; title: string; body: string }[] = [
  { route: 'flames', title: COPY.benefitFlameTitle, body: COPY.benefitFlameBody },
  { route: 'scene', title: COPY.benefitSceneTitle, body: COPY.benefitSceneBody },
  { route: 'sets', title: COPY.benefitSetsTitle, body: COPY.benefitSetsBody },
  { route: 'monthly', title: COPY.benefitHistoryTitle, body: COPY.benefitHistoryBody },
];

/** Where the Plus screens can be entered once the person owns Plus. */
export const PLUS_ENTRIES: { route: Exclude<PlusRoute, 'intro' | 'guide'>; label: string }[] = [
  { route: 'flames', label: '炎を選ぶ' },
  { route: 'scene', label: '焚き火を整える' },
  { route: 'sets', label: COPY.setsTitle },
  { route: 'monthly', label: '月別ふりかえり' },
];

export function PlusIntroScreen() {
  const { state, entitled } = usePlus();
  const headingId = useId();
  const thanksRef = useRef<HTMLHeadingElement | null>(null);
  const [applyError, setApplyError] = useState(false);
  const [applying, setApplying] = useState(false);
  const { store } = state;
  const showThanks = entitled && store.justPurchased;

  // The sheet changes into the thank-you view when a purchase succeeds. Move
  // focus there so VoiceOver users land on the news, not on a removed button.
  useEffect(() => {
    if (showThanks) thanksRef.current?.focus();
  }, [showThanks]);

  const draftedFlame: FlameId = state.flameDraft?.flameMode === 'fixed'
    ? state.flameDraft.fixedFlame
    : state.flameDraft?.favoriteFlames[0] ?? 'aurora';
  const previewFlame = state.presetDraft?.flame ?? draftedFlame;
  const hasDraft = Boolean(state.flameDraft || state.sceneDraft || state.presetDraft);

  const canGoBack = state.routeStack.length > 1;

  const applyChosen = async () => {
    if (applying) return;
    setApplyError(false);
    const { flameDraft, sceneDraft, presetDraft } = plusStore.getState();
    if (!flameDraft && !sceneDraft && !presetDraft) {
      plusStore.acknowledgePurchase();
      plusStore.openScreen('flames');
      return;
    }
    setApplying(true);
    const changes = {
      ...(flameDraft
        ? { flameMode: flameDraft.flameMode, fixedFlame: flameDraft.fixedFlame, favoriteFlames: flameDraft.favoriteFlames }
        : {}),
      ...(sceneDraft ? sceneSettingsOf(sceneDraft) : {}),
    };
    const result = await plusStore.savePreferences(presetDraft
      ? (current) => applyCampfirePreset(current, presetDraft) : changes);
    if (result.ok) {
      plusStore.acknowledgePurchase();
      plusStore.closeAll();
    } else {
      setApplyError(true);
      setApplying(false);
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
          <div className="plus-hero-flame"><CombustionFlame flame={previewFlame} size={64} /></div>
          <h3 ref={thanksRef} tabIndex={-1} className="plus-hero-title">{COPY.thanks}</h3>
          <p className="plus-lead">{state.presetDraft ? `「${state.presetDraft.name}」を適用できます。` : COPY.next}</p>
          <div className="plus-actions">
            <button type="button" className="plus-primary" onClick={() => void applyChosen()} disabled={applying}>
              {applying ? COPY.saveSaving : hasDraft ? COPY.setSelected : COPY.flameTitle}
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
          <div className="plus-intro-visual" aria-hidden="true">
            <img src={SCENES.aurora.artwork} alt="" />
            <div className="plus-hero-flame">
              <CombustionFlame flame="daybreak" size={50} />
              <CombustionFlame flame="aurora" size={82} />
              <CombustionFlame flame="lotus" size={50} />
            </div>
          </div>
          <h3 className="plus-hero-title">{COPY.headline}</h3>
          <ul className="plus-benefits">
            {BENEFITS.map((benefit) => (
              <li key={benefit.route}>
                <button
                  type="button"
                  className="plus-benefit"
                  onClick={() => plusStore.openScreen(benefit.route)}
                >
                  <strong>{benefit.title}</strong>
                  <span className="plus-benefit-cta" aria-hidden="true">{entitled ? '開く' : COPY.tryIt}</span>
                  <span className="plus-benefit-description">{benefit.body}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="plus-purchase-area">
            <button type="button" className="plus-secondary" onClick={() => plusStore.openScreen('guide')}>
              {COPY.guideLink}
            </button>
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
