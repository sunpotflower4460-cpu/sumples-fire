import { useEffect, useId, useState } from 'react';
import { CampfireVisual } from '../../components/CampfireVisual';
import { getCampfireStage } from '../../lib/fireStreak';
import { ambientPlayer } from '../ambientPlayer';
import { COPY } from '../plusCopy';
import { plusStore } from '../plusStore';
import { SCENE_IDS, SCENES } from '../plusPreferences';
import type { AmbientMix, PlusPreferences, SceneId } from '../plusPreferences';
import { getEffectivePreferences, usePlus } from '../usePlus';
import { PlusDialog } from './PlusDialog';
import { SceneBackdrop } from './SceneBackdrop';
import { useAmbientStatus } from './useAmbientStatus';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

const SLIDERS: { key: keyof AmbientMix; label: string }[] = [
  { key: 'fire', label: '火の音' },
  { key: 'rain', label: '雨だれ' },
  { key: 'wind', label: '夜の風' },
];

/** Preview fire for people without Plus: an independent sample, never their real growth. */
const SAMPLE_STAGE = 2;

export function SceneEditorScreen({ ashPoints }: { ashPoints: number }) {
  const { state, entitled } = usePlus();
  const headingId = useId();
  const status = useAmbientStatus();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [draft, setDraftState] = useState<PlusPreferences>(
    () => state.sceneDraft ?? getEffectivePreferences(state.preferences, entitled),
  );
  const playing = status !== 'stopped';
  const stage = entitled ? getCampfireStage(ashPoints) : SAMPLE_STAGE;

  // Sound belongs to this screen only.
  useEffect(() => () => ambientPlayer.stop(), []);

  const setDraft = (next: PlusPreferences) => {
    setDraftState(next);
    plusStore.setSceneDraft(next);
    if (saveStatus !== 'idle') setSaveStatus('idle');
    if (ambientPlayer.getStatus() !== 'stopped') ambientPlayer.setMix(next.mix);
  };

  const chooseScene = (scene: SceneId) => {
    // Picking a scene loads its preset volumes. It never starts playback.
    setDraft({ ...draft, scene, mix: { ...SCENES[scene].preset } });
  };

  const setVolume = (key: keyof AmbientMix, value: number) => {
    setDraft({ ...draft, mix: { ...draft.mix, [key]: value } });
  };

  const toggleSound = () => {
    if (playing) ambientPlayer.stop();
    else void ambientPlayer.start(draft.mix);
  };

  const handleSave = async () => {
    if (saveStatus === 'saving') return;
    setSaveStatus('saving');
    const committed = plusStore.getState().preferences;
    const result = await plusStore.savePreferences({ ...committed, scene: draft.scene, mix: draft.mix });
    setSaveStatus(result.ok ? 'saved' : 'failed');
  };

  const openPurchase = () => {
    ambientPlayer.stop();
    plusStore.openScreen('intro');
  };

  const hasSound = draft.mix.fire + draft.mix.rain + draft.mix.wind > 0;
  const canGoBack = state.routeStack.length > 1;
  const choosingPlusScene = SCENES[draft.scene].plus;

  return (
    <PlusDialog
      titleId={headingId}
      title={COPY.sceneTitle}
      screen="scene"
      canGoBack={canGoBack}
      onBack={() => plusStore.closeScreen()}
      onClose={() => plusStore.closeAll()}
    >
      <p className="plus-help">次に開いたときも、この景色に。</p>

      <div className={`plus-scene scene-${draft.scene} campfire-stage-${stage}`}>
        <SceneBackdrop scene={draft.scene} />
        <CampfireVisual stage={stage} />
      </div>
      {!entitled ? <p className="plus-help">{COPY.previewNoRecord}</p> : null}

      <fieldset className="plus-scene-options">
        <legend className="sr-only">情景</legend>
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
              <strong>{SCENES[id].label}</strong>
              <small>{SCENES[id].plus ? 'Plus' : '無料'}{draft.scene === id ? '・選択中' : ''}</small>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="plus-section-head">
        <h3>環境音</h3>
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
      <p className="plus-help" role="status" aria-live="polite">
        {playing ? '再生中。' : '停止中。聴きたいときだけ再生します。'}
        {!hasSound && !playing ? ' 音量を上げると再生できます。' : ''}
      </p>

      <div className="plus-sliders">
        {SLIDERS.map((slider) => {
          const id = `${headingId}-${slider.key}`;
          return (
            <div key={slider.key} className="plus-slider">
              <label htmlFor={id}>{slider.label}</label>
              <input
                id={id}
                type="range"
                min={0}
                max={100}
                step={5}
                value={draft.mix[slider.key]}
                aria-valuetext={`${draft.mix[slider.key]}%`}
                onChange={(event) => setVolume(slider.key, Number(event.target.value))}
              />
              <output htmlFor={id}>{draft.mix[slider.key]}</output>
            </div>
          );
        })}
      </div>
      <p className="plus-help">{COPY.soundForeground}音を消す・動きを減らす設定は、全員が使えます。</p>

      <div className="plus-actions">
        {entitled ? (
          <button
            type="button"
            className="plus-primary"
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? COPY.saveSaving : COPY.sceneSave}
          </button>
        ) : (
          <>
            <button type="button" className="plus-primary" onClick={openPurchase}>
              {choosingPlusScene ? 'Plusで、この焚き火を使う' : 'Plusで、音と景色を保存する'}
            </button>
            <p className="plus-help">{COPY.previewPlusSave}成長段階と炭ポイントは変わりません。</p>
          </>
        )}
        <p
          className={saveStatus === 'failed' ? 'plus-status is-error' : 'plus-status'}
          role="status"
          aria-live="polite"
        >
          {saveStatus === 'saved' ? COPY.saveSaved : saveStatus === 'failed' ? COPY.saveFailed : ''}
        </p>
        {entitled ? <p className="plus-help">成長段階と炭ポイントは変わりません。</p> : (
          <button type="button" className="plus-link" onClick={openPurchase}>購入内容と価格を確認する</button>
        )}
      </div>
    </PlusDialog>
  );
}

