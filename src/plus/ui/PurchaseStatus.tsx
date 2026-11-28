import { COPY, purchaseButtonLabel } from '../plusCopy';
import { plusStore } from '../plusStore';
import { canStartPurchase, canStartRestore } from '../storeState';
import type { PlusStoreState } from '../storeState';

/**
 * Everything the person needs to know about buying or restoring, as one block
 * (S07). It is a polite live region: messages are announced, never trapped, and
 * nothing here ever covers the rest of the screen.
 */
export function PurchaseStatus({ store, showRestore = true }: { store: PlusStoreState; showRestore?: boolean }) {
  const messages: string[] = [];
  if (store.revokedNotice) messages.push(COPY.storeRevoked);
  if (store.purchase === 'pending') messages.push(COPY.storePending);
  if (store.purchase === 'failed') messages.push(COPY.storeFailed);
  if (store.purchase === 'unverified') messages.push(COPY.storeUnverified);
  if (store.product.status === 'restricted') messages.push(COPY.storeRestricted);
  if (store.entitlement === 'unknown') messages.push(COPY.storeUnknown);
  if (store.restore === 'restoring') messages.push(COPY.storeRestoring);
  if (store.restore === 'restored') messages.push(COPY.storeRestored);
  if (store.restore === 'nothing') messages.push(COPY.storeNothingToRestore);
  if (store.restore === 'unavailable') messages.push(COPY.storeRestoreUnavailable);

  const canRecheck = store.purchase === 'pending';

  return (
    <div className="plus-store-status">
      <div className="plus-status-live" role="status" aria-live="polite" aria-atomic="false">
        {messages.map((message) => (
          <p key={message} className="plus-status">{message}</p>
        ))}
      </div>
      {canRecheck ? (
        <button type="button" className="plus-secondary" onClick={() => void plusStore.recheckEntitlement()}>
          {COPY.storeCheckStatus}
        </button>
      ) : null}
      {showRestore ? (
        <>
          <button
            type="button"
            className="plus-link"
            onClick={() => void plusStore.restore()}
            disabled={!canStartRestore(store)}
          >
            {COPY.restore}
          </button>
          <p className="plus-fineprint">{COPY.restoreScope}</p>
        </>
      ) : null}
    </div>
  );
}

/** The one purchase button, with the state it is in. */
export function PurchaseButton({ store }: { store: PlusStoreState }) {
  if (store.entitlement === 'checking') {
    return <button type="button" className="plus-primary" disabled>{COPY.storeChecking}</button>;
  }

  if (store.product.status === 'loading') {
    return <button type="button" className="plus-primary" disabled>{COPY.storeLoadingPrice}</button>;
  }

  if (store.product.status === 'unavailable') {
    return (
      <>
        <p className="plus-status" role="status">{COPY.storePriceUnavailable}</p>
        <button type="button" className="plus-secondary" onClick={() => void plusStore.refreshProduct()}>
          {COPY.storeRetry}
        </button>
      </>
    );
  }

  if (store.product.status === 'restricted') {
    return <button type="button" className="plus-primary" disabled>{COPY.storeRestricted}</button>;
  }

  const purchasing = store.purchase === 'purchasing';
  return (
    <button
      type="button"
      className="plus-primary"
      onClick={() => void plusStore.purchase()}
      disabled={!canStartPurchase(store)}
      aria-busy={purchasing || undefined}
    >
      {purchasing ? COPY.storePurchasing : store.purchase === 'failed' ? COPY.storeRetry : purchaseButtonLabel(store.product.displayPrice)}
    </button>
  );
}
