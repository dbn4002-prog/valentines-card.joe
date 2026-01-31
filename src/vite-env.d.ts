/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VALENTINE_NAME: string
  readonly VITE_LANGUAGE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
