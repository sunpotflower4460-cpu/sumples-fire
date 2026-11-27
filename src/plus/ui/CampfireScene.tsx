import { CampfireVisual } from '../../components/CampfireVisual';
import { SCENES } from '../scenes';
import type { SceneId } from '../scenes';

export function CampfireScene({
  scene,
  stage,
}: {
  scene: SceneId;
  stage: Parameters<typeof CampfireVisual>[0]['stage'];
}) {
  const artwork = SCENES[scene].artwork;

  return (
    <div className={`plus-scene scene-${scene} campfire-stage-${stage}`}>
      {artwork ? <img className="plus-scene-art" src={artwork} alt="" decoding="async" /> : null}
      <CampfireVisual stage={stage} />
    </div>
  );
}
