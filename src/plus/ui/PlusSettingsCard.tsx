import { getFlame } from '../flames';
import { COPY } from '../plusCopy';
import { plusStore } from '../plusStore';
import { usePlus } from '../usePlus';
import { SCENES } from '../scenes';
import { PLUS_ENTRIES } from './PlusIntroScreen';

/**
 * S01 — the Plus card in Settings. It is a normal, always-visible card: no
 * badge, no pulse, no pop-up. It simply tells the truth about what Plus is and
 * lets people open it when they want to.
 */
export function PlusSettingsCard() {
  const { state, entitled, effectivePreferences } = usePlus();
  const { store } = state;
  const restoring = store.restore === 'restoring';
  const { flameMode, fixedFlame, favoriteFlames, scene } = effectivePreferences;
  const entryDetail = {
    flames: flameMode === 'fixed' ? getFlame(fixedFlame).label
      : flameMode === 'favorites' ? `お気に入り${favoriteFlames.length}種類`
        : flameMode === 'shuffle' ? COPY.flameShuffle : COPY.flameAuto,
    scene: SCENES[scene].label,
    sets: '',
    monthly: '年間表示',
    intro: '',
  };

  const restoreMessage = store.restore === 'restored' ? COPY.storeRestored
    : store.restore === 'nothing' ? COPY.storeNothingToRestore
      : store.restore === 'unavailable' ? COPY.storeRestoreUnavailable
        : store.restore === 'restoring' ? COPY.storeRestoring
          : '';

  return (
    <section className="plus-card" aria-labelledby="plus-card-title">
      <div className="plus-card-head">
        <h3 id="plus-card-title">{COPY.name}</h3>
        {entitled ? <span className="plus-badge">{COPY.purchased}</span> : null}
      </div>

      {entitled ? (
        <>
          <p className="plus-card-copy">{COPY.headline}</p>
          <ul className="plus-entry-list">
            {PLUS_ENTRIES.map((entry) => (
              <li key={entry.route}>
                <button
                  type="button"
                  className="plus-entry"
                  aria-label={entry.label}
                  onClick={(event) => plusStore.openScreen(entry.route, event.currentTarget)}
                >
                  <span>{entry.label}</span>
                  <span className="plus-entry-detail">
                    {entryDetail[entry.route]}
                    <span aria-hidden="true">›</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="plus-card-copy">{COPY.headline}</p>
          <p className="plus-card-sub">{COPY.catalogSummary}</p>
          <button
            type="button"
            className="plus-primary"
            onClick={(event) => plusStore.openScreen('intro', event.currentTarget)}
          >
            くわしく見る
          </button>
        </>
      )}

      <p className="plus-status" role="status" aria-live="polite">
        {store.revokedNotice ? COPY.storeRevoked : restoreMessage}
      </p>

      <button
        type="button"
        className="plus-link"
        onClick={() => void plusStore.restore()}
        disabled={restoring}
      >
        {COPY.restore}
      </button>
      <p className="plus-fineprint">{COPY.restoreScope}</p>
    </section>
  );
}
