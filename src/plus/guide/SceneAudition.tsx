import { useState } from 'react';
import { hasAmbientSound, type AmbientMix } from '../ambientOptions';
import { SCENES, SCENE_IDS, type SceneId } from '../scenes';
import { useAmbientStatus } from '../ui/useAmbientStatus';
import styles from './showcase.module.css';

type SceneAuditionProps = {
  playSound: (mix: AmbientMix) => Promise<boolean | undefined>;
  stopSound: () => void;
};

export function SceneAudition({ playSound, stopSound }: SceneAuditionProps) {
  const [sceneId, setSceneId] = useState<SceneId>('aurora');
  const [errorScene, setErrorScene] = useState<SceneId | null>(null);
  const status = useAmbientStatus();
  const scene = SCENES[sceneId];
  const hasSound = hasAmbientSound(scene.preset);
  const toggle = async () => {
    if (status !== 'stopped') {
      stopSound();
      return;
    }
    setErrorScene(null);
    if (await playSound(scene.preset) === false) setErrorScene(sceneId);
  };

  return (
    <div className={styles.sceneDemo}>
      <figure className={styles.landscape}>
        {scene.artwork && <img src={scene.artwork} alt="" loading="lazy" />}
        <figcaption>
          <div aria-live="polite"><h3>{scene.label}</h3><p>{scene.description}</p></div>
          <button type="button" className={styles.secondary} disabled={!hasSound}
            aria-pressed={status !== 'stopped'} onClick={() => void toggle()}>
            {!hasSound ? '初期設定は無音' : status === 'stopped' ? '環境音を聴く' : '環境音を止める'}
          </button>
        </figcaption>
      </figure>
      <div className={styles.scenes} role="group" aria-label="試し見する焚き火の景色">
        {SCENE_IDS.map((id) => (
          <button type="button" key={id} aria-pressed={id === sceneId}
            onClick={() => { stopSound(); setErrorScene(null); setSceneId(id); }}>
            {SCENES[id].artwork
              ? <img src={SCENES[id].artwork} alt="" loading="lazy" />
              : <span aria-hidden="true" className={styles.night} />}
            <span>{SCENES[id].label}</span>
          </button>
        ))}
      </div>
      {errorScene === sceneId && <p role="status">音を再生できませんでした。もう一度お試しください。</p>}
    </div>
  );
}
