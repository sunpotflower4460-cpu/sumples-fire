import { useId, useState } from 'react';
import type { CSSProperties } from 'react';
import { FlameArtwork } from '../../components/FlameArtwork';
import { isPlusBurnSpectacle, PLUS_BURN_TYPES } from '../../lib/fireBurnSpectacle';
import { AUTO_FLAME_IDS, FLAME_IDS, getFlameEntry } from '../flames';
import type { FlameId } from '../flames';
import { COPY } from '../plusCopy';
import { plusStore } from '../plusStore';
import { validatePlusPreferences } from '../plusPreferences';
import type { FlameMode, PlusPreferences } from '../plusPreferences';
import { getEffectivePreferences, usePlus } from '../usePlus';
import { PlusDialog } from './PlusDialog';
import { useFlamePreview } from './useFlamePreview';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';
type Catalog = 'plus' | 'auto';

const MODES: { id: FlameMode; label: string }[] = [
  { id: 'auto', label: COPY.flameAuto },
  { id: 'fixed', label: COPY.flameFixed },
  { id: 'favorites', label: COPY.flameFavorites },
  { id: 'shuffle', label: COPY.flameShuffle },
];

const MODE_HELP: Record<FlameMode, string> = {
  auto: `タスクや連続日数に応じて、無料の${AUTO_FLAME_IDS.length}種類から決まります。`,
  fixed: '選んだ炎を毎回使います。',
  favorites: '登録した炎から選びます。2種類以上なら、前回と同じ炎は続けて出ません。',
  shuffle: `全${FLAME_IDS.length}種類から、前回とは違う炎を選びます。`,
};

const CATALOGS = {
  plus: { label: 'Plus専用', ids: PLUS_BURN_TYPES },
  auto: { label: 'おまかせの炎', ids: AUTO_FLAME_IDS },
} as const;

export function FlamePickerScreen() {
  const { state, entitled } = usePlus();
  const headingId = useId();
  const preview = useFlamePreview();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [draft, setDraftState] = useState<PlusPreferences>(
    () => state.flameDraft ?? getEffectivePreferences(state.preferences, entitled),
  );
  const [activeId, setActiveId] = useState<FlameId>(() => (
    draft.flameMode === 'fixed'
      ? draft.fixedFlame
      : draft.flameMode === 'favorites' ? draft.favoriteFlames[0] ?? 'aurora' : 'aurora'
  ));
  const catalog: Catalog = isPlusBurnSpectacle(activeId) ? 'plus' : 'auto';
  const active = getFlameEntry(activeId);
  const validation = validatePlusPreferences(draft);
  const saving = saveStatus === 'saving';
  const choosing = draft.flameMode === 'fixed' || draft.flameMode === 'favorites';
  const favoriteCount = draft.favoriteFlames.length;

  const setDraft = (next: PlusPreferences) => {
    setDraftState(next);
    plusStore.setFlameDraft(next);
    setSaveStatus('idle');
  };

  const showFlame = (id: FlameId) => {
    if (activeId !== id) preview.stop();
    setActiveId(id);
  };

  const handleCard = (id: FlameId) => {
    showFlame(id);
    if (draft.flameMode === 'fixed') {
      setDraft({ ...draft, fixedFlame: id });
    } else if (draft.flameMode === 'favorites') {
      setDraft({
        ...draft,
        favoriteFlames: draft.favoriteFlames.includes(id)
          ? draft.favoriteFlames.filter((flame) => flame !== id)
          : [...draft.favoriteFlames, id],
      });
    }
  };

  const isChosen = (id: FlameId) => (
    draft.flameMode === 'fixed' ? draft.fixedFlame === id
      : draft.flameMode === 'favorites' && draft.favoriteFlames.includes(id)
  );

  const handleSave = async () => {
    if (validation || saving) return;
    setSaveStatus('saving');
    const result = await plusStore.savePreferences({
      flameMode: draft.flameMode,
      fixedFlame: draft.fixedFlame,
      favoriteFlames: draft.favoriteFlames,
    });
    setSaveStatus(result.ok ? 'saved' : 'failed');
  };

  const purchaseLabel = draft.flameMode === 'fixed' ? 'Plusで、この炎を使う'
    : draft.flameMode === 'favorites' ? 'Plusで、お気に入りを使う'
      : draft.flameMode === 'shuffle' ? 'Plusで、全種類をシャッフル' : 'Plusの購入内容を見る';

  return (
    <PlusDialog
      titleId={headingId}
      title={COPY.flameTitle}
      screen="flames"
      canGoBack={state.routeStack.length > 1}
      onBack={() => plusStore.closeScreen()}
      onClose={() => plusStore.closeAll()}
      footer={(
        <div className="plus-actions">
          <p
            className={saveStatus === 'failed' || validation ? 'plus-status is-error' : 'plus-status'}
            aria-live="polite"
          >
            {validation ?? (saveStatus === 'saved' ? COPY.saveSaved
              : saveStatus === 'failed' ? COPY.saveFailed : '')}
          </p>
          {entitled ? (
            <button type="button" className="plus-primary" onClick={handleSave} disabled={Boolean(validation) || saving}>
              {saving ? COPY.saveSaving : 'この設定にする'}
            </button>
          ) : (
            <button
              type="button"
              className="plus-primary"
              onClick={() => plusStore.openScreen('intro')}
              disabled={Boolean(validation)}
            >
              {purchaseLabel}
            </button>
          )}
        </div>
      )}
    >
      <fieldset className="plus-segmented plus-flame-modes" aria-describedby={`${headingId}-mode-help`} disabled={saving}>
        <legend className="sr-only">炎の選び方</legend>
        {MODES.map((mode) => (
          <label key={mode.id} className={draft.flameMode === mode.id ? 'is-active' : undefined}>
            <input
              type="radio"
              name="plus-flame-mode"
              value={mode.id}
              checked={draft.flameMode === mode.id}
              onChange={() => setDraft({
                ...draft,
                flameMode: mode.id,
                fixedFlame: mode.id === 'fixed' ? activeId : draft.fixedFlame,
              })}
            />
            <span>{mode.label}</span>
          </label>
        ))}
      </fieldset>
      <p className="plus-help" id={`${headingId}-mode-help`}>{MODE_HELP[draft.flameMode]}</p>

      <section
        className="plus-flame-spotlight"
        aria-labelledby={`${headingId}-spotlight`}
        style={{ '--spotlight-glow': active.spectacle.bgGlowColor } as CSSProperties}
      >
        <div className="plus-flame-stage">
          <FlameArtwork spectacle={active.spectacle} size={104} />
          {preview.layer}
        </div>
        <div className="plus-flame-details">
          <h3 id={`${headingId}-spotlight`}>{active.label}</h3>
          <p className="plus-help">{active.description}</p>
          <button
            type="button"
            className="plus-secondary plus-preview-trigger"
            onClick={() => preview.play(activeId)}
            aria-disabled={preview.playing !== null}
          >
            {preview.playing ? '試し見中…' : COPY.previewLabel}
          </button>
        </div>
      </section>

      <fieldset className="plus-segmented plus-catalog-switch">
        <legend className="sr-only">炎の種類</legend>
        {(Object.entries(CATALOGS) as [Catalog, (typeof CATALOGS)[Catalog]][]).map(([id, group]) => (
          <label key={id} className={catalog === id ? 'is-active' : undefined}>
            <input
              type="radio"
              name="plus-flame-catalog"
              checked={catalog === id}
              onChange={() => showFlame(group.ids.find(isChosen) ?? group.ids[0])}
            />
            <span>{group.label} <small>{group.ids.length}</small></span>
          </label>
        ))}
      </fieldset>

      <ul className="plus-flame-grid" aria-label="炎の一覧">
        {CATALOGS[catalog].ids.map((id) => {
          const flame = getFlameEntry(id);
          const selected = isChosen(id);
          return (
            <li key={id}>
              <button
                type="button"
                className={selected ? 'plus-flame-card is-selected' : 'plus-flame-card'}
                aria-pressed={choosing ? selected : undefined}
                aria-current={id === activeId ? 'true' : undefined}
                data-flame-id={id}
                onClick={() => handleCard(id)}
                disabled={saving}
                style={{ '--spotlight-glow': flame.spectacle.bgGlowColor } as CSSProperties}
              >
                <FlameArtwork spectacle={flame.spectacle} size={42} />
                <span className="plus-flame-name">{flame.label}</span>
                {selected ? <span className="plus-flame-check" aria-hidden="true">✓</span> : null}
              </button>
            </li>
          );
        })}
      </ul>

      {draft.flameMode === 'favorites' ? (
        <p className="plus-help" role="status">お気に入りに{favoriteCount}種類を選択中</p>
      ) : null}
      <p className="plus-help">{COPY.previewNoRecord}</p>
    </PlusDialog>
  );
}
