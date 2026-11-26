/** App Store Connect product for the one-time Plus unlock (non-consumable). */
export const PLUS_PRODUCT_ID = 'com.sunpotflower.sumplesfire.plus';

/**
 * Durable key for Plus *display* preferences. This is deliberately not an
 * entitlement: the purchase is verified by StoreKit and never read from here.
 */
export const PLUS_PREFERENCES_KEY = 'fire-task-plus-preferences-v1';
