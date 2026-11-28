import { getAppStorageDriver, writeDurableConfirmed } from '../lib/appStorage';
import type { FlameId } from './flames';
import type { CampfirePreset } from './campfireSets';
import { PLUS_PREFERENCES_KEY } from './plusConstants';
import {
  DEFAULT_PLUS_PREFERENCES,
  normalizePlusPreferences,
  parsePlusPreferences,
  serializePlusPreferences,
  validatePlusPreferences,
} from './plusPreferences';
import type { PlusPreferences } from './plusPreferences';
import type { PlusPurchaseService } from './purchaseService';
import { selectPurchaseService } from './selectPurchaseService';
import { canStartPurchase, canStartRestore, initialStoreState, isPlusActive, storeReducer } from './storeState';
import type { EntitlementCheck, PlusStoreState, StoreAction } from './storeState';

/** The Plus screens. Only one is shown at a time; the rest of the stack waits underneath. */
export type PlusRoute = 'guide' | 'intro' | 'flames' | 'scene' | 'sets' | 'monthly';

export type SaveResult =
  | { ok: true }
  | { ok: false; reason: 'notEntitled' | 'invalid' | 'storage' };

type PreferenceChanges = Partial<Omit<PlusPreferences, 'version' | 'lastRealFlame'>>;
export type PreferenceUpdate = PreferenceChanges | ((current: PlusPreferences) => PreferenceChanges);

export type PlusState = {
  store: PlusStoreState;
  /** Confirmed settings and the most recent real flame. */
  preferences: PlusPreferences;
  routeStack: PlusRoute[];
  /** Flame choice the person was trying when they were sent to the purchase screen. */
  flameDraft: PlusPreferences | null;
  /** Scene + mix the person was trying when they were sent to the purchase screen. */
  sceneDraft: PlusPreferences | null;
  presetDraft: CampfirePreset | null;
};

type PlusStoreDeps = {
  readPreferences: () => string | null;
  writePreferences: (value: string) => Promise<boolean>;
  createService: () => Promise<PlusPurchaseService>;
};

export const createPlusStore = (deps: PlusStoreDeps) => {
  let state: PlusState = {
    store: initialStoreState,
    preferences: normalizePlusPreferences(null),
    routeStack: [],
    flameDraft: null,
    sceneDraft: null,
    presetDraft: null,
  };
  const listeners = new Set<() => void>();
  let service: PlusPurchaseService | null = null;
  let unsubscribeService: (() => void) | null = null;
  let initPromise: Promise<void> | null = null;
  let entitlementCheckId = 0;
  let entitlementEventVersion = 0;
  let saveChain: Promise<unknown> = Promise.resolve();
  let returnFocus: HTMLElement | null = null;

  const emit = () => listeners.forEach((listener) => listener());
  const setState = (next: Partial<PlusState>) => {
    state = { ...state, ...next };
    emit();
  };
  const dispatch = (action: StoreAction) => {
    const next = storeReducer(state.store, action);
    if (next !== state.store) setState({ store: next });
  };

  const readPreferences = () => parsePlusPreferences(deps.readPreferences());

  /** Re-read saved preferences. Call once durable storage is ready. */
  const hydrate = () => {
    setState({ preferences: readPreferences() });
  };

  const refreshProduct = async () => {
    if (!service) return;
    dispatch({ type: 'productReloading' });
    const result = await service.loadProduct();
    if (result.status === 'ready') dispatch({ type: 'productLoaded', displayPrice: result.displayPrice });
    else if (result.status === 'restricted') dispatch({ type: 'productRestricted' });
    else dispatch({ type: 'productUnavailable' });
  };

  const readEntitlement = async (purchaseService: PlusPurchaseService) => {
    const checkId = ++entitlementCheckId;
    const result = await purchaseService.checkEntitlement();
    // A StoreKit update, completed transaction or newer check supersedes this snapshot.
    return checkId === entitlementCheckId ? result : undefined;
  };

  const recheckEntitlement = async () => {
    if (!service) return;
    const result = await readEntitlement(service);
    if (result === undefined) return;
    if (result === 'entitled' && state.store.purchase === 'pending') {
      dispatch({ type: 'entitlementGranted' });
    } else {
      dispatch({ type: 'entitlementChecked', result });
    }
  };

  const confirmTransactionEntitlement = async (
    purchaseService: PlusPurchaseService,
    reported: Exclude<EntitlementCheck, 'unknown'>,
    eventVersionAtStart: number,
  ) => {
    if (eventVersionAtStart === entitlementEventVersion || reported === state.store.entitlement) return reported;

    // The operation and a StoreKit notification disagree. Read the current receipt
    // again and keep the verified state if StoreKit cannot answer.
    const current = await readEntitlement(purchaseService);
    return current === 'entitled' || current === 'notEntitled' ? current : state.store.entitlement;
  };

  /** Start talking to the store. Idempotent; never blocks the app. */
  const init = (injected?: PlusPurchaseService): Promise<void> => {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      service = injected ?? await deps.createService();
      unsubscribeService = service.subscribe((update) => {
        entitlementEventVersion += 1;
        entitlementCheckId += 1;
        dispatch({ type: update === 'granted' ? 'entitlementGranted' : 'entitlementRevoked' });
      });
      await Promise.all([recheckEntitlement(), refreshProduct()]);
    })();
    return initPromise;
  };

  const purchase = async () => {
    if (!service || !canStartPurchase(state.store)) return;
    const eventVersion = entitlementEventVersion;
    dispatch({ type: 'purchaseStarted' });
    let outcome = await service.purchase();
    if (outcome === 'success') {
      const confirmed = await confirmTransactionEntitlement(service, 'entitled', eventVersion);
      entitlementCheckId += 1;
      if (confirmed !== 'entitled') outcome = 'failed';
    }
    dispatch({ type: 'purchaseFinished', outcome });
  };

  const restore = async () => {
    if (!service || !canStartRestore(state.store)) return;
    const eventVersion = entitlementEventVersion;
    dispatch({ type: 'restoreStarted' });
    let outcome = await service.restore();
    if (outcome !== 'unavailable') {
      const reported = outcome === 'restored' ? 'entitled' : 'notEntitled';
      const confirmed = await confirmTransactionEntitlement(service, reported, eventVersion);
      entitlementCheckId += 1;
      outcome = confirmed === 'entitled' ? 'restored' : 'nothing';
    }
    dispatch({ type: 'restoreFinished', outcome });
  };

  /**
   * Save preferences, serialized so two quick saves cannot land out of order.
   * `committed` state only changes after the write truly succeeded; on failure
   * nothing is claimed and the caller keeps the draft so it can retry.
   */
  const savePreferences = (update: PreferenceUpdate): Promise<SaveResult> => {
    const run = async (): Promise<SaveResult> => {
      if (!isPlusActive(state.store)) return { ok: false, reason: 'notEntitled' };
      const changes = typeof update === 'function' ? update(state.preferences) : update;
      const candidate = { ...state.preferences, ...changes, lastRealFlame: state.preferences.lastRealFlame };
      if (validatePlusPreferences(candidate)) return { ok: false, reason: 'invalid' };
      const normalized = normalizePlusPreferences(candidate);

      const ok = await deps.writePreferences(serializePlusPreferences(normalized)).catch(() => false);
      if (!ok) return { ok: false, reason: 'storage' };
      // A real Fire can update its last-flame hint while this write is in flight.
      setState({ preferences: { ...normalized, lastRealFlame: state.preferences.lastRealFlame } });
      return { ok: true };
    };

    const result = saveChain.then(run, run);
    saveChain = result;
    return result;
  };

  /**
   * Remember which flame a real Fire just used, so favourites do not repeat it.
   * A hint only: a failed write is ignored and never blocks or alters the Fire.
   */
  const recordRealFlame = (id: FlameId) => {
    if (state.preferences.lastRealFlame === id) return;
    setState({ preferences: { ...state.preferences, lastRealFlame: id } });
    if (isPlusActive(state.store)) {
      const write = () => isPlusActive(state.store)
        ? deps.writePreferences(serializePlusPreferences(state.preferences)).catch(() => false)
        : false;
      saveChain = saveChain.then(write, write);
    }
  };

  const openScreen = (route: PlusRoute, trigger?: HTMLElement | null) => {
    if (state.routeStack.length === 0) {
      const active = typeof document !== 'undefined' ? document.activeElement : null;
      returnFocus = trigger ?? (active && typeof HTMLElement !== 'undefined' && active instanceof HTMLElement ? active : null);
    }
    const current = state.routeStack[state.routeStack.length - 1];
    if (current === route) return;
    setState({
      routeStack: [...state.routeStack, route],
      ...(route === 'intro' && current !== 'sets' ? { presetDraft: null } : {}),
    });
  };

  const closeScreen = () => {
    if (state.routeStack.length === 0) return;
    const stack = state.routeStack.slice(0, -1);
    setState({
      routeStack: stack,
      // Drafts only survive while a purchase screen is above (or below) them.
      ...(stack.length === 0 ? { flameDraft: null, sceneDraft: null, presetDraft: null } : {}),
    });
  };

  const closeAll = () => {
    setState({ routeStack: [], flameDraft: null, sceneDraft: null, presetDraft: null });
  };

  const takeReturnFocus = () => {
    const target = returnFocus;
    returnFocus = null;
    return target;
  };

  return {
    getState: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    hydrate,
    init,
    refreshProduct,
    recheckEntitlement,
    purchase,
    restore,
    savePreferences,
    recordRealFlame,
    setFlameDraft: (flameDraft: PlusPreferences | null) => setState({ flameDraft }),
    setSceneDraft: (sceneDraft: PlusPreferences | null) => setState({ sceneDraft }),
    setPresetDraft: (presetDraft: CampfirePreset) => setState({ presetDraft }),
    openScreen,
    closeScreen,
    closeAll,
    takeReturnFocus,
    dismissPurchaseStatus: () => dispatch({ type: 'dismissPurchaseStatus' }),
    dismissRestoreStatus: () => dispatch({ type: 'dismissRestoreStatus' }),
    dismissRevokedNotice: () => dispatch({ type: 'dismissRevokedNotice' }),
    acknowledgePurchase: () => dispatch({ type: 'acknowledgePurchase' }),
    dispose: () => {
      unsubscribeService?.();
      unsubscribeService = null;
      listeners.clear();
    },
  };
};

export type PlusStore = ReturnType<typeof createPlusStore>;

/** The app-wide store, bound to durable storage and the platform's store service. */
export const plusStore: PlusStore = createPlusStore({
  readPreferences: () => {
    try {
      return getAppStorageDriver()?.getItem(PLUS_PREFERENCES_KEY) ?? null;
    } catch {
      return null;
    }
  },
  writePreferences: (value) => writeDurableConfirmed(PLUS_PREFERENCES_KEY, value),
  createService: () => selectPurchaseService(),
});

/** Synchronous read for non-React code (e.g. starting a Fire). */
export const isPlusEntitledNow = () => isPlusActive(plusStore.getState().store);

export { DEFAULT_PLUS_PREFERENCES };
