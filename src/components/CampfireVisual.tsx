/**
 * The campfire picture: logs, flames and embers that grow with the stage.
 * Shared by the free "今日" campfire and the Plus scene on "炭", so both always
 * show the same growth. It owns no state and never changes how fast anything grows.
 */
export const CAMPFIRE_EMBER_COUNTS = [2, 4, 6, 8, 10, 14] as const;

export function CampfireVisual({ stage }: { stage: 0 | 1 | 2 | 3 | 4 | 5 }) {
  const emberCount = CAMPFIRE_EMBER_COUNTS[stage];

  return (
    <div className="campfire-visual" aria-hidden="true">
      <div className="campfire-logs">
        <div className="campfire-log log-left" />
        <div className="campfire-log log-right" />
        <div className="campfire-log log-base" />
      </div>

      <div className="campfire-flames">
        <i className="campfire-flame cf-1" />
        <i className="campfire-flame cf-2" />
        <i className="campfire-flame cf-3" />
        {stage >= 2 ? <i className="campfire-flame cf-4" /> : null}
        {stage >= 3 ? <i className="campfire-flame cf-5" /> : null}
        {stage >= 4 ? <><i className="campfire-flame cf-6" /><i className="campfire-flame cf-7" /></> : null}
        {stage >= 5 ? <><i className="campfire-flame cf-8" /><i className="campfire-flame cf-9" /></> : null}
      </div>

      <div className="campfire-embers">
        {Array.from({ length: emberCount }, (_, index) => (
          <i key={index} className={`campfire-ember ce-${index + 1}`} />
        ))}
      </div>

      {stage >= 3 ? <div className="campfire-outer-glow" /> : null}
    </div>
  );
}
