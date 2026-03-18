/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_PARTYKIT_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
