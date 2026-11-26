import { describe, expect, it } from 'vitest';
import {
  canStartPurchase,
  initialStoreState,
  isPlusActive,
  storeReducer,
} from './storeState';
import type { PlusStoreState, StoreAction } from './storeState';

const run = (actions: StoreAction[], from: PlusStoreState = initialStoreState) => (
  actions.reduce(storeReducer, from)
);
const ready = (extra: StoreAction[] = []) => run([
  { type: 'entitlementChecked', result: 'notEntitled' },
  { type: 'productLoaded', displayPrice: '¥800' },
  ...extra,
]);

describe('storeReducer — launch', () => {
  it('does not apply Plus or invite a purchase while the entitlement is still being checked', () => {
    const state = run([{ type: 'productLoaded', displayPrice: '¥800' }]);
    expect(state.entitlement).toBe('checking');
    expect(isPlusActive(state)).toBe(false);
    expect(canStartPurchase(state)).toBe(false);
  });

  it('an unverifiable check at launch is "unknown", not "not purchased"', () => {
    const state = run([{ type: 'entitlementChecked', result: 'unknown' }]);
    expect(state.entitlement).toBe('unknown');
    expect(isPlusActive(state)).toBe(false);
    expect(state.revokedNotice).toBe(false);
  });

  it('a verified entitlement unlocks Plus (existing owner, also offline)', () => {
    const state = run([{ type: 'entitlementChecked', result: 'entitled' }]);
    expect(isPlusActive(state)).toBe(true);
    expect(canStartPurchase(state)).toBe(false);
  });

  it('failing to verify later never locks an owner out', () => {
    const state = run([
      { type: 'entitlementChecked', result: 'entitled' },
      { type: 'entitlementChecked', result: 'unknown' },
    ]);
    expect(state.entitlement).toBe('entitled');
  });
});

describe('storeReducer — price', () => {
  it('price loading or unavailable disables buying without touching an existing entitlement', () => {
    const owner = run([
      { type: 'entitlementChecked', result: 'entitled' },
      { type: 'productUnavailable' },
    ]);
    expect(isPlusActive(owner)).toBe(true);

    const visitor = run([
      { type: 'entitlementChecked', result: 'notEntitled' },
      { type: 'productUnavailable' },
    ]);
    expect(canStartPurchase(visitor)).toBe(false);
  });

  it('a failed price load can be retried', () => {
    const state = run([{ type: 'productUnavailable' }, { type: 'productReloading' }, { type: 'productLoaded', displayPrice: '¥800' }], ready());
    expect(state.product).toEqual({ status: 'ready', displayPrice: '¥800' });
  });

  it('purchase restrictions disable buying', () => {
    const state = run([{ type: 'productRestricted' }], ready());
    expect(canStartPurchase(state)).toBe(false);
    expect(state.product.status).toBe('restricted');
  });
});

describe('storeReducer — purchase', () => {
  it('success unlocks Plus and marks the purchase for the thank-you view', () => {
    const state = run([
      { type: 'purchaseStarted' },
      { type: 'purchaseFinished', outcome: 'success' },
    ], ready());
    expect(isPlusActive(state)).toBe(true);
    expect(state.justPurchased).toBe(true);
    expect(state.purchase).toBe('idle');
  });

  it('cancelling returns quietly: nothing changes and there is no error state', () => {
    const state = run([
      { type: 'purchaseStarted' },
      { type: 'purchaseFinished', outcome: 'cancelled' },
    ], ready());
    expect(state.purchase).toBe('idle');
    expect(isPlusActive(state)).toBe(false);
    expect(canStartPurchase(state)).toBe(true);
  });

  it('a second tap while purchasing is ignored', () => {
    const once = run([{ type: 'purchaseStarted' }], ready());
    expect(storeReducer(once, { type: 'purchaseStarted' })).toBe(once);
    expect(canStartPurchase(once)).toBe(false);
  });

  it('pending does not unlock, does not allow a duplicate purchase, and is not permanent', () => {
    const pending = run([
      { type: 'purchaseStarted' },
      { type: 'purchaseFinished', outcome: 'pending' },
    ], ready());
    expect(pending.purchase).toBe('pending');
    expect(isPlusActive(pending)).toBe(false);
    expect(canStartPurchase(pending)).toBe(false);

    // The transaction completes later (parent approves): unlock, quietly.
    const approved = storeReducer(pending, { type: 'entitlementGranted' });
    expect(isPlusActive(approved)).toBe(true);
    expect(approved.purchase).toBe('idle');
    expect(approved.justPurchased).toBe(true);

    // A fresh launch forgets "pending" (it is never persisted), so buying is possible again.
    const relaunched = run([
      { type: 'entitlementChecked', result: 'notEntitled' },
      { type: 'productLoaded', displayPrice: '¥800' },
    ]);
    expect(canStartPurchase(relaunched)).toBe(true);
  });

  it('an unverified transaction never grants and does not push another purchase', () => {
    const state = run([
      { type: 'purchaseStarted' },
      { type: 'purchaseFinished', outcome: 'unverified' },
    ], ready());
    expect(state.purchase).toBe('unverified');
    expect(isPlusActive(state)).toBe(false);
    expect(storeReducer(state, { type: 'dismissPurchaseStatus' }).purchase).toBe('idle');
  });

  it('other failures are retryable and change nothing', () => {
    const state = run([
      { type: 'purchaseStarted' },
      { type: 'purchaseFinished', outcome: 'failed' },
    ], ready());
    expect(state.purchase).toBe('failed');
    expect(isPlusActive(state)).toBe(false);
    expect(storeReducer(state, { type: 'purchaseStarted' }).purchase).toBe('purchasing');
  });

  it('an owner cannot start a second purchase', () => {
    const owner = run([{ type: 'entitlementChecked', result: 'entitled' }]);
    expect(storeReducer(owner, { type: 'purchaseStarted' })).toBe(owner);
  });

  it('a purchase blocked by device restrictions moves to the restricted state', () => {
    const state = run([
      { type: 'purchaseStarted' },
      { type: 'purchaseFinished', outcome: 'restricted' },
    ], ready());
    expect(state.product.status).toBe('restricted');
    expect(state.purchase).toBe('idle');
  });
});

describe('storeReducer — restore', () => {
  it('restores Plus when the entitlement is found', () => {
    const state = run([
      { type: 'restoreStarted' },
      { type: 'restoreFinished', outcome: 'restored' },
    ], ready());
    expect(isPlusActive(state)).toBe(true);
    expect(state.restore).toBe('restored');
  });

  it('"nothing found" is reported as that — and only when the store really answered', () => {
    const state = run([
      { type: 'restoreStarted' },
      { type: 'restoreFinished', outcome: 'nothing' },
    ], ready());
    expect(state.restore).toBe('nothing');
    expect(isPlusActive(state)).toBe(false);
  });

  it('a communication failure is not "nothing found" and keeps a verified entitlement', () => {
    const owner = run([
      { type: 'entitlementChecked', result: 'entitled' },
      { type: 'restoreStarted' },
      { type: 'restoreFinished', outcome: 'unavailable' },
    ]);
    expect(owner.restore).toBe('unavailable');
    expect(isPlusActive(owner)).toBe(true);
  });

  it('ignores a second restore while one is running', () => {
    const state = run([{ type: 'restoreStarted' }], ready());
    expect(storeReducer(state, { type: 'restoreStarted' })).toBe(state);
    expect(canStartPurchase(state)).toBe(false);
  });
});

describe('storeReducer — refunds and revocation', () => {
  it('a verified revocation locks only the extras and shows its notice once', () => {
    const state = run([
      { type: 'entitlementChecked', result: 'entitled' },
      { type: 'entitlementRevoked' },
    ]);
    expect(isPlusActive(state)).toBe(false);
    expect(state.revokedNotice).toBe(true);
    expect(storeReducer(state, { type: 'dismissRevokedNotice' }).revokedNotice).toBe(false);
  });

  it('a verified "not entitled" after owning it is treated as a revocation', () => {
    const state = run([
      { type: 'entitlementChecked', result: 'entitled' },
      { type: 'entitlementChecked', result: 'notEntitled' },
    ]);
    expect(state.entitlement).toBe('notEntitled');
    expect(state.revokedNotice).toBe(true);
  });

  it('buying again after a revocation works and clears the notice', () => {
    const state = run([
      { type: 'entitlementChecked', result: 'entitled' },
      { type: 'entitlementRevoked' },
      { type: 'productLoaded', displayPrice: '¥800' },
      { type: 'purchaseStarted' },
      { type: 'purchaseFinished', outcome: 'success' },
    ]);
    expect(isPlusActive(state)).toBe(true);
    expect(state.revokedNotice).toBe(false);
  });
});
