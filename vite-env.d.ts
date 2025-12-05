/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_KEY?: string;
  readonly VITE_AI_MODEL?: string;
  readonly VITE_AI_API_URL?: string;
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
