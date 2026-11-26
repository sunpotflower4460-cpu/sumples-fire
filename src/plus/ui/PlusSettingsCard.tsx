import { COPY } from '../plusCopy';
import { plusStore } from '../plusStore';
import { usePlus } from '../usePlus';
import { PLUS_ENTRIES } from './PlusIntroScreen';

/**
 * S01 — the Plus card in Settings. It is a normal, always-visible card: no
 * badge, no pulse, no pop-up. It simply tells the truth about what Plus is and
 * lets people open it when they want to.
 */
export function PlusSettingsCard() {
  const { state, entitled } = usePlus();
  const { store } = state;
  const restoring = store.restore === 'restoring';

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
                  onClick={(event) => plusStore.openScreen(entry.route, event.currentTarget)}
                >
                  <span>{entry.label}</span>
                  <span aria-hidden="true">›</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="plus-card-copy">{COPY.headline}</p>
          <p className="plus-card-sub">9種類の炎の選択・自分の焚き火・炭の月別ふりかえり</p>
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
