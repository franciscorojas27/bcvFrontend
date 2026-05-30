/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly BCV_BACKEND_URL?: string;
  readonly PUBLIC_BCV_BACKEND_URL?: string;
  readonly PUBLIC_BCV_BACKEND_WS_URL?: string;
}

interface Window {
  __BCV_BACKEND_URL__?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
