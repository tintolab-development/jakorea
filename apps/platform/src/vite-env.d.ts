/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADDRESS_API_KEY?: string
  readonly VITE_JUSO_CONFM_KEY?: string
  readonly VITE_JUSO_ADDRESS_API_URL?: string
  readonly VITE_NEIS_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string }
  export default classes
}
