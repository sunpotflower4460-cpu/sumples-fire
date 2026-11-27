import { CampfireVisual } from '../../components/CampfireVisual';
import type { FlameId } from '../flames';
import type { SceneId } from '../scenes';
import { SceneLandscape } from './SceneLandscape';

export function CampfireScene({
  scene,
  stage,
  flame,
  active,
}: {
  scene: SceneId;
  stage: Parameters<typeof CampfireVisual>[0]['stage'];
  flame?: FlameId;
  active?: boolean;
}) {
  return (
    <div className={`plus-scene scene-${scene} campfire-stage-${stage}`}>
      <SceneLandscape scene={scene} active={active} />
      <CampfireVisual stage={stage} flame={flame} />
    </div>
  );
}
