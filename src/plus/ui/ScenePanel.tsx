import { useEffect } from 'react';
import { CampfireVisual } from '../../components/CampfireVisual';
import { getCampfireStage, getCampfireStageLabel } from '../../lib/fireStreak';
import { ambientPlayer } from '../ambientPlayer';
import { COPY } from '../plusCopy';
import { plusStore } from '../plusStore';
import { SCENES } from '../plusPreferences';
import { usePlus } from '../usePlus';
import { SceneBackdrop } from './SceneBackdrop';
import { useAmbientStatus } from './useAmbientStatus';

/**
 * "炭" scene area: look at your campfire in the scene you chose. It shares the
 * campfire's existing growth (stage comes from the same ash total), so it adds
 * no points, no growth speed and no second progression.
 */
export function ScenePanel({ ashPoints }: { ashPoints: number }) {
  const { entitled, effectivePreferences } = usePlus();
  const status = useAmbientStatus();
  const stage = getCampfireStage(ashPoints);
  const sceneId = effectivePreferences.scene;
  const mix = effectivePreferences.mix;
  const hasSound = mix.fire + mix.rain + mix.wind > 0;
  const playing = status !== 'stopped';

  // Sound belongs to this screen: leaving "炭" (or losing Plus) ends it.
  useEffect(() => () => ambientPlayer.stop(), []);
  useEffect(() => {
    if (!entitled) ambientPlayer.stop();
  }, [entitled]);

  const toggleSound = () => {
    if (playing) ambientPlayer.stop();
    else void ambientPlayer.start(mix);
  };

  return (
    <section className="plus-scene-panel" aria-labelledby="plus-scene-title">
      <div className={`plus-scene scene-${sceneId} campfire-stage-${stage}`}>
        <SceneBackdrop scene={sceneId} />
        <CampfireVisual stage={stage} />
      </div>

      <div className="plus-scene-meta">
        <h3 id="plus-scene-title">あなたの焚き火</h3>
        <p>{getCampfireStageLabel(stage)}・{SCENES[sceneId].label}</p>
      </div>

      <div className="plus-scene-actions">
        {entitled ? (
          <>
            <button
              type="button"
              className="plus-secondary"
              onClick={toggleSound}
              disabled={!playing && !hasSound}
              aria-pressed={playing}
            >
              {playing ? COPY.soundStop : COPY.soundPlay}
            </button>
            {!hasSound ? (
              <p className="plus-help">音量が0です。「焚き火を整える」で音を足せます。</p>
            ) : (
              <p className="plus-help" role="status">{playing ? COPY.soundForeground : '停止中。聴きたいときだけ再生します。'}</p>
            )}
          </>
        ) : null}

        <div className="plus-scene-links">
          <button
            type="button"
            className="plus-secondary"
            onClick={(event) => plusStore.openScreen('scene', event.currentTarget)}
          >
            焚き火を整える
          </button>
          <button
            type="button"
            className="plus-secondary"
            onClick={(event) => plusStore.openScreen('monthly', event.currentTarget)}
          >
            月ごとに見る{!entitled ? <span className="plus-badge">Plus</span> : null}
          </button>
        </div>
      </div>
    </section>
  );
}
