import { useId, useState } from 'react';
import { FLAME_CATALOG, getFlame } from '../flames';
import type { FlameId } from '../flames';
import { COPY } from '../plusCopy';
import { plusStore } from '../plusStore';
import { validatePlusPreferences } from '../plusPreferences';
import type { FlameMode, PlusPreferences } from '../plusPreferences';
import { getEffectivePreferences, usePlus } from '../usePlus';
import { FlameGlyph } from './FlameGlyph';
import { PlusDialog } from './PlusDialog';
import { useFlamePreview } from './useFlamePreview';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

const MODES: { id: FlameMode; label: string }[] = [
  { id: 'auto', label: COPY.flameAuto },
  { id: 'fixed', label: COPY.flameFixed },
  { id: 'favorites', label: COPY.flameFavorites },
];

const MODE_HELP: Record<FlameMode, string> = {
  auto: '炎の種類はおまかせです。いつもどおり、タスクや連続日数に応じて決まります。',
  fixed: '選んだ1種類の炎で、毎回Fireします。',
  favorites: '選んだ炎の中から、Fireのたびに選びます。前回と同じ炎は続けて出ません。',
};

export function FlamePickerScreen() {
  const { state, entitled } = usePlus();
  const headingId = useId();
  const preview = useFlamePreview();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  // The draft survives a trip to the purchase screen (it lives in the store).
  const [draft, setDraftState] = useState<PlusPreferences>(
    () => state.flameDraft ?? getEffectivePreferences(state.preferences, entitled),
  );
  const [lastTapped, setLastTapped] = useState<FlameId | null>(null);

  const setDraft = (next: PlusPreferences) => {
    setDraftState(next);
    plusStore.setFlameDraft(next);
    if (saveStatus !== 'idle') setSaveStatus('idle');
  };

  const handleMode = (mode: FlameMode) => {
    setDraft({ ...draft, flameMode: mode });
  };

  const handleCard = (id: FlameId) => {
    let shouldPlay = true;
    if (draft.flameMode === 'fixed') {
      setDraft({ ...draft, fixedFlame: id });
    } else if (draft.flameMode === 'favorites') {
      const on = draft.favoriteFlames.includes(id);
      shouldPlay = !on;
      setDraft({
        ...draft,
        favoriteFlames: on
          ? draft.favoriteFlames.filter((flame) => flame !== id)
          : [...draft.favoriteFlames, id],
      });
    }
    setLastTapped(id);
    if (shouldPlay) preview.play(id);
  };

  const isSelected = (id: FlameId) => (
    draft.flameMode === 'fixed' ? draft.fixedFlame === id
      : draft.flameMode === 'favorites' ? draft.favoriteFlames.includes(id)
        : false
  );

  const validation = validatePlusPreferences(draft);
  const needsSelection = draft.flameMode === 'favorites' && draft.favoriteFlames.length === 0;

  const handleSave = async () => {
    if (validation || saveStatus === 'saving') return;
    setSaveStatus('saving');
    const committed = plusStore.getState().preferences;
    const result = await plusStore.savePreferences({
      ...committed,
      flameMode: draft.flameMode,
      fixedFlame: draft.fixedFlame,
      favoriteFlames: draft.favoriteFlames,
    });
    setSaveStatus(result.ok ? 'saved' : 'failed');
  };

  const openPurchase = () => plusStore.openScreen('intro');

  const previewLabel = lastTapped ? getFlame(lastTapped).label : null;
  const canGoBack = state.routeStack.length > 1;

  return (
    <PlusDialog
      titleId={headingId}
      title={COPY.flameTitle}
      screen="flames"
      canGoBack={canGoBack}
      onBack={() => plusStore.closeScreen()}
      onClose={() => plusStore.closeAll()}
    >
      <div className="plus-section-head">
        <h3>Fireのあとに咲く炎</h3>
        {!entitled ? <span className="plus-badge">PLUS</span> : null}
      </div>
      <p className="plus-help">タップして、燃え方を試します。</p>

      <fieldset className="plus-segmented">
        <legend className="sr-only">炎の選び方</legend>
        {MODES.map((mode) => (
          <label key={mode.id} className={draft.flameMode === mode.id ? 'is-active' : undefined}>
            <input
              type="radio"
              name="plus-flame-mode"
              value={mode.id}
              checked={draft.flameMode === mode.id}
              onChange={() => handleMode(mode.id)}
            />
            <span>{mode.label}</span>
          </label>
        ))}
      </fieldset>
      <p className="plus-help" id="plus-flame-mode-help">{MODE_HELP[draft.flameMode]}</p>

      <ul className="plus-flame-grid" aria-label="炎の一覧">
        {FLAME_CATALOG.map((flame) => {
          const selected = isSelected(flame.id);
          const selectable = draft.flameMode !== 'auto';
          const label = selectable
            ? `${flame.label}${selected ? '、選択中' : ''}`
            : `${flame.label}を試し見`;
          return (
            <li key={flame.id}>
              <button
                type="button"
                className={selected ? 'plus-flame-card is-selected' : 'plus-flame-card'}
                aria-pressed={selectable ? selected : undefined}
                aria-label={label}
                data-flame-id={flame.id}
                onClick={() => handleCard(flame.id)}
              >
                <FlameGlyph spectacle={flame.spectacle} size={40} />
                <span className="plus-flame-name">{flame.label}</span>
                {selected ? <span className="plus-flame-check" aria-hidden="true">✓</span> : null}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="plus-preview-note" role="status" aria-live="polite">
        {preview.playing && previewLabel ? (
          <strong>{previewLabel}の{COPY.previewLabel}中</strong>
        ) : previewLabel ? (
          <strong>{previewLabel}を{COPY.previewLabel}しました</strong>
        ) : (
          <strong>{COPY.previewLabel}ができます</strong>
        )}
        {needsSelection ? <span className="plus-warning">{COPY.flameFavoritesEmpty}</span> : null}
      </div>
      <p className="plus-help">試し見は無料です。タスクや炭ポイントには影響しません。</p>
      <p className="plus-help">{COPY.freeAutoStillShowsAll}</p>

      <div className="plus-actions">
        {entitled ? (
          <button
            type="button"
            className="plus-primary"
            onClick={handleSave}
            disabled={Boolean(validation) || saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? COPY.saveSaving : 'この設定にする'}
          </button>
        ) : draft.flameMode === 'auto' ? (
          <p className="plus-help">おまかせは無料で、そのまま使えます。</p>
        ) : (
          <>
            <button type="button" className="plus-primary" onClick={openPurchase}>
              Plusで、この炎を使う
            </button>
            <p className="plus-help">{COPY.previewPlusSave}</p>
          </>
        )}
        <p
          className={saveStatus === 'failed' ? 'plus-status is-error' : 'plus-status'}
          role="status"
          aria-live="polite"
        >
          {saveStatus === 'saved' ? COPY.saveSaved : saveStatus === 'failed' ? COPY.saveFailed : ''}
        </p>
        {!entitled ? (
          <button type="button" className="plus-link" onClick={openPurchase}>購入内容と価格を確認する</button>
        ) : null}
      </div>

      {preview.layer}
    </PlusDialog>
  );
}
