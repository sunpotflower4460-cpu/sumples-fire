import { useEffect, useId, useState } from 'react';
import { getCampfireStage } from '../../lib/fireStreak';
import {
  AMBIENT_LABELS,
  AMBIENT_LAYERS,
  AMBIENT_PRESETS,
  hasAmbientSound,
  makeAmbientMix,
} from '../ambientOptions';
import type { AmbientLayerId, AmbientMix } from '../ambientOptions';
import { ambientPlayer } from '../ambientPlayer';
import { COPY } from '../plusCopy';
import type { PlusPreferences } from '../plusPreferences';
import { plusStore } from '../plusStore';
import { SCENE_IDS, SCENES } from '../scenes';
import type { SceneId } from '../scenes';
import { getEffectivePreferences, usePlus } from '../usePlus';
import { CampfireScene } from './CampfireScene';
import { PlusDialog } from './PlusDialog';
import { useAmbientStatus } from './useAmbientStatus';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

const SAMPLE_STAGE = 2;
const mixesMatch = (first: AmbientMix, second: AmbientMix) => (
  AMBIENT_LAYERS.every((layer) => first[layer] === second[layer])
);

export function SceneEditorScreen({ ashPoints }: { ashPoints: number }) {
  const { state, entitled } = usePlus();
  const headingId = useId();
  const status = useAmbientStatus();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [view, setView] = useState<'scenes' | 'audio'>('scenes');
  const [draft, setDraftState] = useState<PlusPreferences>(
    () => state.sceneDraft ?? getEffectivePreferences(state.preferences, entitled),
  );
  const playing = status !== 'stopped';
  const stage = entitled ? getCampfireStage(ashPoints) : SAMPLE_STAGE;
  const scene = SCENES[draft.scene];
  const hasSound = hasAmbientSound(draft.mix);
  const saving = saveStatus === 'saving';
  const activePreset = mixesMatch(scene.preset, draft.mix) ? 'scene'
    : !hasSound ? 'silent'
      : AMBIENT_PRESETS.find((preset) => mixesMatch(preset.mix, draft.mix))?.id ?? 'custom';

  // A playback session ends when this editor closes or the entitlement changes.
  useEffect(() => () => ambientPlayer.stop(), [entitled]);

  const setDraft = (next: PlusPreferences) => {
    setDraftState(next);
    plusStore.setSceneDraft(next);
    setSaveStatus('idle');
    if (hasAmbientSound(next.mix)) ambientPlayer.setMix(next.mix);
    else ambientPlayer.stop();
  };

  const chooseScene = (id: SceneId) => {
    setDraft({ ...draft, scene: id, mix: { ...SCENES[id].preset } });
  };

  const choosePreset = (id: string) => {
    const mix = id === 'scene' ? scene.preset
      : id === 'silent' ? makeAmbientMix() : AMBIENT_PRESETS.find((preset) => preset.id === id)?.mix;
    if (mix) setDraft({ ...draft, mix: { ...mix } });
  };

  const setVolume = (key: AmbientLayerId, value: number) => {
    setDraft({ ...draft, mix: { ...draft.mix, [key]: value } });
  };

  const toggleSound = () => {
    if (playing) ambientPlayer.stop();
    else void ambientPlayer.start(draft.mix);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaveStatus('saving');
    const result = await plusStore.savePreferences({ scene: draft.scene, mix: draft.mix });
    setSaveStatus(result.ok ? 'saved' : 'failed');
  };

  return (
    <PlusDialog
      titleId={headingId}
      title={COPY.sceneTitle}
      screen="scene"
      canGoBack={state.routeStack.length > 1}
      onBack={() => plusStore.closeScreen()}
      onClose={() => plusStore.closeAll()}
      footer={(
        <div className="plus-actions">
          <p className={saveStatus === 'failed' ? 'plus-status is-error' : 'plus-status'} aria-live="polite">
            {saveStatus === 'saved' ? COPY.saveSaved : saveStatus === 'failed' ? COPY.saveFailed : ''}
          </p>
          {entitled ? (
            <button type="button" className="plus-primary" onClick={handleSave} disabled={saving}>
              {saving ? COPY.saveSaving : COPY.sceneSave}
            </button>
          ) : (
            <button type="button" className="plus-primary" onClick={() => plusStore.openScreen('intro')}>
              {draft.scene === 'night' ? 'Plusで、音と景色を保存する' : 'Plusで、この焚き火を使う'}
            </button>
          )}
        </div>
      )}
    >
      <section className="plus-scene-preview" aria-labelledby={`${headingId}-scene`}>
        <CampfireScene scene={draft.scene} stage={stage} />
        <div className="plus-scene-caption">
          <div className="plus-section-head">
            <h3 id={`${headingId}-scene`}>{scene.label}</h3>
            <button
              type="button"
              className="plus-secondary plus-sound-toggle"
              onClick={toggleSound}
              aria-pressed={playing}
              disabled={!playing && !hasSound}
            >
              {playing ? COPY.soundStop : COPY.soundPlay}
            </button>
          </div>
          <p className="plus-help">{scene.description}</p>
        </div>
      </section>

      <fieldset className="plus-segmented plus-catalog-switch">
        <legend className="sr-only">焚き火の設定項目</legend>
        <label className={view === 'scenes' ? 'is-active' : undefined}>
          <input type="radio" name="plus-scene-view" checked={view === 'scenes'} onChange={() => setView('scenes')} />
          <span>景色</span>
        </label>
        <label className={view === 'audio' ? 'is-active' : undefined}>
          <input type="radio" name="plus-scene-view" checked={view === 'audio'} onChange={() => setView('audio')} />
          <span>環境音</span>
        </label>
      </fieldset>

      {view === 'scenes' ? (
        <>
          <fieldset className="plus-scene-options" disabled={saving} aria-describedby={`${headingId}-scene-help`}>
            <legend className="sr-only">景色の一覧</legend>
            {SCENE_IDS.map((id) => (
              <label key={id} className={draft.scene === id ? 'is-active' : undefined}>
                <input
                  type="radio"
                  name="plus-scene"
                  value={id}
                  checked={draft.scene === id}
                  onChange={() => chooseScene(id)}
                />
                <span className="plus-scene-option">
                  <span className="plus-scene-thumb" aria-hidden="true">
                    {SCENES[id].artwork ? <img src={SCENES[id].artwork} alt="" decoding="async" /> : null}
                  </span>
                  <strong>{SCENES[id].label}</strong>
                  {id === 'night' ? <small>無料</small> : null}
                  {draft.scene === id ? <span className="plus-scene-check" aria-hidden="true">✓</span> : null}
                </span>
              </label>
            ))}
          </fieldset>
          <p className="plus-help" id={`${headingId}-scene-help`}>景色を選び直すと、その景色に合う音量に切り替わります。</p>
        </>
      ) : (
        <section className="plus-audio-card" aria-labelledby={`${headingId}-sounds`}>
          <h3 id={`${headingId}-sounds`} className="sr-only">環境音の調整</h3>
          <p className="plus-help" role="status">
            {status === 'starting' ? '音を準備しています…' : COPY.soundForeground}
            {!hasSound ? ' 音量を上げると再生できます。' : ''}
          </p>

          <div className="plus-mix-presets">
            <label htmlFor={`${headingId}-preset`}>音の組み合わせ</label>
            <select
              id={`${headingId}-preset`}
              value={activePreset}
              onChange={(event) => choosePreset(event.target.value)}
              disabled={saving}
            >
              <option value="scene">景色に合わせる</option>
              {AMBIENT_PRESETS.map((preset) => <option value={preset.id} key={preset.id}>{preset.label}</option>)}
              <option value="silent">無音</option>
              {activePreset === 'custom' ? <option value="custom" disabled>カスタム</option> : null}
            </select>
          </div>
          <div className="plus-sliders">
            {AMBIENT_LAYERS.map((layer) => {
              const id = `${headingId}-${layer}`;
              const volume = draft.mix[layer];
              return (
                <div key={layer} className="plus-slider">
                  <label htmlFor={id}>{AMBIENT_LABELS[layer]}</label>
                  <input
                    id={id}
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={volume}
                    aria-valuetext={`${volume}%`}
                    onChange={(event) => setVolume(layer, Number(event.target.value))}
                    disabled={saving}
                  />
                  <output htmlFor={id}>{volume}%</output>
                </div>
              );
            })}
          </div>
        </section>
      )}
      {!entitled ? <p className="plus-help">{COPY.previewNoRecord}</p> : null}
    </PlusDialog>
  );
}
