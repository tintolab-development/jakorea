/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Vite 빌드 시각 (Asia/Seoul) */
  readonly VITE_APP_BUILD_AT?: string
  /** Vercel/GitHub 커밋 SHA 앞 7자 */
  readonly VITE_APP_GIT_SHA?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.woff2' {
  const src: string
  export default src
}
