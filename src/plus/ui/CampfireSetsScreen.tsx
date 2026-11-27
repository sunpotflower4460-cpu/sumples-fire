import { useEffect, useId, useState } from 'react';
import { CombustionFlame } from '../../components/CombustionFlame';
import { getCampfireStage } from '../../lib/fireStreak';
import { AMBIENT_LABELS, AMBIENT_LAYERS, hasAmbientSound } from '../ambientOptions';
import { ambientPlayer } from '../ambientPlayer';
import {
  CAMPFIRE_PRESETS,
  applyCampfirePreset,
  applyCampfireSet,
  campfireSetFromPreset,
  captureCampfireSet,
  describeSetFlame,
} from '../campfireSets';
import { COPY } from '../plusCopy';
import { CAMPFIRE_SET_NAME_LIMIT, CAMPFIRE_SET_SLOTS } from '../plusPreferences';
import type { CampfireSet } from '../plusPreferences';
import { plusStore } from '../plusStore';
import type { PreferenceUpdate } from '../plusStore';
import { SCENES } from '../scenes';
import { usePlus } from '../usePlus';
import { CampfireScene } from './CampfireScene';
import { PlusDialog } from './PlusDialog';
import { useAmbientStatus } from './useAmbientStatus';

type Status = 'idle' | 'saving' | 'saved' | 'applied' | 'failed';

const slotName = (index: number) => `マイセット${index + 1}`;

function SetPreview({ title, set, stage }: { title: string; set: CampfireSet; stage: ReturnType<typeof getCampfireStage> }) {
  const status = useAmbientStatus();
  const playing = status !== 'stopped';
  const sounds = AMBIENT_LAYERS.filter((id) => set.mix[id] > 0)
    .map((id) => `${AMBIENT_LABELS[id]}${set.mix[id]}%`);
  const flame = set.flameMode === 'fixed' ? set.fixedFlame
    : set.flameMode === 'favorites' ? set.favoriteFlames[0] ?? 'normal' : 'normal';

  return (
    <section className="plus-set-preview" aria-label={title}>
      <CampfireScene scene={set.scene} stage={stage} flame={flame} />
      <div className="plus-set-detail">
        <div className="plus-section-head">
          <h3>{title}</h3>
          <button
            className="plus-secondary plus-sound-toggle"
            type="button"
            disabled={!playing && !hasAmbientSound(set.mix)}
            onClick={() => playing ? ambientPlayer.stop() : void ambientPlayer.start(set.mix)}
          >
            {playing ? COPY.soundStop : COPY.soundPlay}
          </button>
        </div>
        <dl className="plus-set-info">
          <div>
            <dt>炎</dt>
            <dd><CombustionFlame flame={flame} size={30} />{describeSetFlame(set)}</dd>
          </div>
          <div>
            <dt>景色</dt>
            <dd>{SCENES[set.scene].label}</dd>
          </div>
          <div>
            <dt>環境音</dt>
            <dd>{sounds.length ? sounds.join('・') : '無音'}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

export function CampfireSetsScreen({ ashPoints }: { ashPoints: number }) {
  const { state, entitled, effectivePreferences } = usePlus();
  const headingId = useId();
  const [view, setView] = useState<'preset' | 'mine'>('preset');
  const [presetIndex, setPresetIndex] = useState(() => (
    Math.max(0, CAMPFIRE_PRESETS.findIndex((preset) => preset.id === state.presetDraft?.id))
  ));
  const [slot, setSlot] = useState(0);
  const [name, setName] = useState(() => effectivePreferences.campfireSets[0]?.name ?? '');
  const [status, setStatus] = useState<Status>('idle');
  const mine = entitled && view === 'mine';
  const saved = effectivePreferences.campfireSets[slot];
  const preset = CAMPFIRE_PRESETS[presetIndex];
  const preview = mine ? saved : campfireSetFromPreset(preset);
  const title = mine ? saved?.name ?? slotName(slot) : preset.name;
  const saving = status === 'saving';
  const stage = entitled ? getCampfireStage(ashPoints) : 2;

  useEffect(() => () => ambientPlayer.stop(), [entitled]);

  const choose = (change: () => void) => {
    ambientPlayer.stop();
    setStatus('idle');
    change();
  };

  const write = async (changes: PreferenceUpdate, success: 'saved' | 'applied') => {
    if (saving) return;
    setStatus('saving');
    const result = await plusStore.savePreferences(changes);
    setStatus(result.ok ? success : 'failed');
  };

  const apply = () => {
    if (!entitled) {
      plusStore.setPresetDraft(preset);
      plusStore.openScreen('intro');
    } else if (mine && saved) {
      void write((current) => applyCampfireSet(current, saved), 'applied');
    } else if (!mine) {
      void write((current) => applyCampfirePreset(current, preset), 'applied');
    }
  };

  const saveCurrent = () => {
    const label = name.trim() || slotName(slot);
    setName(label);
    void write((current) => ({
      campfireSets: current.campfireSets.map((set, index) => (
        index === slot ? { ...captureCampfireSet(current), name: label } : set
      )),
    }), 'saved');
  };

  const message = status === 'saved' ? '現在の設定をセットに保存しました。'
    : status === 'applied' ? 'このセットを適用しました。'
      : status === 'failed' ? COPY.saveFailed : '';

  return (
    <PlusDialog
      titleId={headingId}
      title={COPY.setsTitle}
      screen="sets"
      canGoBack={state.routeStack.length > 1}
      onBack={() => plusStore.closeScreen()}
      onClose={() => plusStore.closeAll()}
      footer={(
        <div className="plus-actions">
          <p className={status === 'failed' ? 'plus-status is-error' : 'plus-status'} role="status">{message}</p>
          {preview ? (
            <button type="button" className="plus-primary" disabled={saving} onClick={apply}>
              {saving ? COPY.saveSaving : entitled ? 'このセットを使う' : 'Plusでこのセットを使う'}
            </button>
          ) : null}
        </div>
      )}
    >
      {entitled ? (
        <fieldset className="plus-segmented plus-catalog-switch" disabled={saving}>
          <legend className="sr-only">焚き火セットの種類</legend>
          <label className={!mine ? 'is-active' : undefined}>
            <input type="radio" name="plus-set-view" checked={!mine} onChange={() => choose(() => setView('preset'))} />
            <span>おすすめ</span>
          </label>
          <label className={mine ? 'is-active' : undefined}>
            <input type="radio" name="plus-set-view" checked={mine} onChange={() => choose(() => setView('mine'))} />
            <span>マイセット</span>
          </label>
        </fieldset>
      ) : null}
      {preview ? <SetPreview title={title} set={preview} stage={stage} /> : null}

      {mine ? (
        <>
          <fieldset className="plus-set-options plus-set-slots" disabled={saving}>
            <legend>保存先</legend>
            {Array.from({ length: CAMPFIRE_SET_SLOTS }, (_, index) => (
              <label key={index} className={slot === index ? 'is-active' : undefined}>
                <input
                  type="radio"
                  name="plus-set-slot"
                  checked={slot === index}
                  onChange={() => choose(() => {
                    setSlot(index);
                    setName(effectivePreferences.campfireSets[index]?.name ?? '');
                  })}
                />
                <span>{slotName(index)}<small>{effectivePreferences.campfireSets[index]?.name ?? '未保存'}</small></span>
              </label>
            ))}
          </fieldset>
          <div className="plus-set-editor">
            <label htmlFor={`${headingId}-name`}>セット名</label>
            <input
              id={`${headingId}-name`}
              type="text"
              value={name}
              placeholder={slotName(slot)}
              maxLength={CAMPFIRE_SET_NAME_LIMIT}
              disabled={saving}
              onChange={(event) => {
                setName(event.target.value);
                setStatus('idle');
              }}
            />
            <button type="button" className="plus-secondary" disabled={saving} onClick={saveCurrent}>
              {saving ? COPY.saveSaving : saved ? '現在の設定で上書き' : '現在の設定を保存'}
            </button>
          </div>
        </>
      ) : (
        <fieldset className="plus-set-options" disabled={saving}>
          <legend>おすすめの組み合わせ</legend>
          {CAMPFIRE_PRESETS.map((item, index) => (
            <label key={item.id} className={presetIndex === index ? 'is-active' : undefined}>
              <input
                type="radio"
                name="plus-set-preset"
                checked={presetIndex === index}
                onChange={() => choose(() => setPresetIndex(index))}
              />
              <span className="plus-set-option">
                <img src={SCENES[item.scene].artwork} alt="" decoding="async" />
                <strong>{item.name}</strong>
              </span>
            </label>
          ))}
        </fieldset>
      )}
    </PlusDialog>
  );
}
