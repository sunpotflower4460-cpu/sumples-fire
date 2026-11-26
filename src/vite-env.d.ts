/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Build-time switch for the scripted purchase mock (E2E/dev only).
   * Never set for release builds; scripts/check-release-bundle.mjs enforces that.
   */
  readonly VITE_PLUS_STORE_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
