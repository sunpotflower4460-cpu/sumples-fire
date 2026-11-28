/**
 * Purchase / entitlement state for Fire Task Plus.
 *
 * Pure reducer, written to mirror the state table in docs/plus/DESIGN.md §10.2.
 * The principle behind every branch: *not being able to find out* is never the
 * same as *not having bought*. Failures to verify keep whatever was already
 * verified; only a verified "no entitlement" or a verified revocation locks
 * the extra features, and neither of them ever touches tasks or records.
 */

/** Whether the person owns Plus, as verified by StoreKit (never from a saved flag). */
export type EntitlementPhase =
  /** App just started; StoreKit has not answered yet. Plus is not applied meanwhile. */
  | 'checking'
  | 'entitled'
  | 'notEntitled'
  /** StoreKit could not answer. Treated as "no change" once something was known. */
  | 'unknown';

export type ProductState =
  | { status: 'loading' }
  | { status: 'ready'; displayPrice: string }
  /** Product not served (not registered yet, no network, …). */
  | { status: 'unavailable' }
  /** In-app purchases are blocked on this device (Screen Time etc.). */
  | { status: 'restricted' };

export type PurchasePhase =
  | 'idle'
  | 'purchasing'
  /** Ask to Buy / extra authentication: waiting for an outcome. In-memory only. */
  | 'pending'
  | 'failed'
  /** StoreKit returned a transaction that failed verification. Never grants. */
  | 'unverified';

export type RestorePhase = 'idle' | 'restoring' | 'restored' | 'nothing' | 'unavailable';

export type PlusStoreState = {
  entitlement: EntitlementPhase;
  product: ProductState;
  purchase: PurchasePhase;
  restore: RestorePhase;
  /** A verified refund/revocation was observed; shown once, then dismissed. */
  revokedNotice: boolean;
  /** Plus was just granted by a purchase in this session (drives the thank-you view). */
  justPurchased: boolean;
};

export const initialStoreState: PlusStoreState = {
  entitlement: 'checking',
  product: { status: 'loading' },
  purchase: 'idle',
  restore: 'idle',
  revokedNotice: false,
  justPurchased: false,
};

export type EntitlementCheck = 'entitled' | 'notEntitled' | 'unknown';
export type PurchaseOutcome = 'success' | 'cancelled' | 'pending' | 'unverified' | 'failed' | 'restricted';
export type RestoreOutcome = 'restored' | 'nothing' | 'unavailable';

export type StoreAction =
  | { type: 'productLoaded'; displayPrice: string }
  | { type: 'productUnavailable' }
  | { type: 'productRestricted' }
  | { type: 'productReloading' }
  | { type: 'entitlementChecked'; result: EntitlementCheck }
  /** A verified transaction arrived from Transaction.updates (outside any purchase tap). */
  | { type: 'entitlementGranted' }
  /** A verified revocation / refund arrived. */
  | { type: 'entitlementRevoked' }
  | { type: 'purchaseStarted' }
  | { type: 'purchaseFinished'; outcome: PurchaseOutcome }
  | { type: 'restoreStarted' }
  | { type: 'restoreFinished'; outcome: RestoreOutcome }
  | { type: 'dismissPurchaseStatus' }
  | { type: 'dismissRestoreStatus' }
  | { type: 'dismissRevokedNotice' }
  | { type: 'acknowledgePurchase' };

export const storeReducer = (state: PlusStoreState, action: StoreAction): PlusStoreState => {
  const purchaseAfterUpdate = state.purchase === 'purchasing' ? state.purchase : 'idle';
  switch (action.type) {
    case 'productLoaded':
      return { ...state, product: { status: 'ready', displayPrice: action.displayPrice } };
    case 'productUnavailable':
      return { ...state, product: { status: 'unavailable' } };
    case 'productRestricted':
      return { ...state, product: { status: 'restricted' } };
    case 'productReloading':
      return { ...state, product: { status: 'loading' } };

    case 'entitlementChecked': {
      if (action.result === 'entitled') {
        return { ...state, entitlement: 'entitled', revokedNotice: false, purchase: purchaseAfterUpdate };
      }
      if (action.result === 'notEntitled') {
        // A *verified* "no entitlement" after owning it means a refund/revocation.
        const wasEntitled = state.entitlement === 'entitled';
        return {
          ...state,
          entitlement: 'notEntitled',
          revokedNotice: wasEntitled ? true : state.revokedNotice,
        };
      }
      // Could not verify: never downgrade something that was already verified.
      if (state.entitlement === 'entitled' || state.entitlement === 'notEntitled') return state;
      return { ...state, entitlement: 'unknown' };
    }

    case 'entitlementGranted':
      return {
        ...state,
        entitlement: 'entitled',
        revokedNotice: false,
        purchase: purchaseAfterUpdate,
        // A pending purchase that completed later: thank them, but only quietly.
        justPurchased: state.purchase === 'pending' ? true : state.justPurchased,
      };

    case 'entitlementRevoked':
      return {
        ...state,
        entitlement: 'notEntitled',
        revokedNotice: true,
        purchase: purchaseAfterUpdate,
        justPurchased: false,
      };

    case 'purchaseStarted':
      // Double taps and pending purchases cannot start a second purchase.
      if (state.purchase === 'purchasing' || state.purchase === 'pending') return state;
      if (state.entitlement === 'entitled') return state;
      return { ...state, purchase: 'purchasing', restore: 'idle' };

    case 'purchaseFinished': {
      switch (action.outcome) {
        case 'success':
          return {
            ...state,
            entitlement: 'entitled',
            purchase: 'idle',
            revokedNotice: false,
            justPurchased: true,
          };
        case 'cancelled':
          // No message: the person simply changed their mind.
          return { ...state, purchase: 'idle' };
        case 'pending':
          return { ...state, purchase: isPlusActive(state) ? 'idle' : 'pending' };
        case 'unverified':
          return { ...state, purchase: 'unverified' };
        case 'restricted':
          return { ...state, purchase: 'idle', product: { status: 'restricted' } };
        case 'failed':
        default:
          return { ...state, purchase: 'failed' };
      }
    }

    case 'restoreStarted':
      if (!canStartRestore(state)) return state;
      return { ...state, restore: 'restoring' };

    case 'restoreFinished': {
      if (action.outcome === 'restored') {
        return {
          ...state,
          entitlement: 'entitled',
          restore: 'restored',
          revokedNotice: false,
          purchase: 'idle',
        };
      }
      if (action.outcome === 'nothing') {
        return { ...state, entitlement: 'notEntitled', restore: 'nothing' };
      }
      // Could not reach the store: keep every verified entitlement as it was.
      return { ...state, restore: 'unavailable' };
    }

    case 'dismissPurchaseStatus':
      return state.purchase === 'failed' || state.purchase === 'unverified'
        ? { ...state, purchase: 'idle' }
        : state;
    case 'dismissRestoreStatus':
      return { ...state, restore: 'idle' };
    case 'dismissRevokedNotice':
      return { ...state, revokedNotice: false };
    case 'acknowledgePurchase':
      return { ...state, justPurchased: false };
    default:
      return state;
  }
};

/** Plus features apply only for a verified entitlement. */
export const isPlusActive = (state: PlusStoreState): boolean => state.entitlement === 'entitled';

/** The purchase button may be pressed. */
export const canStartPurchase = (state: PlusStoreState): boolean => (
  state.entitlement !== 'entitled'
  && state.entitlement !== 'checking'
  && state.product.status === 'ready'
  && state.purchase !== 'purchasing'
  && state.purchase !== 'pending'
  && state.restore !== 'restoring'
);

/** StoreKit can open a system sheet for either purchase or restore. */
export const canStartRestore = (state: PlusStoreState): boolean => (
  state.restore !== 'restoring' && state.purchase !== 'purchasing'
);
