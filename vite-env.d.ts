/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_KEY?: string;
  readonly VITE_AI_MODEL?: string;
  readonly VITE_AI_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
