/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

interface ImportMetaEnv {
  readonly VITE_ADDRESS_API_KEY?: string
  readonly VITE_JUSO_CONFM_KEY?: string
  readonly VITE_JUSO_ADDRESS_API_URL?: string
  readonly VITE_NEIS_API_KEY?: string
  /** 브라우저에서 직접 호출할 백엔드 오리진 (크로스 오리진). 로컬 프록시 쓸 때는 비움. */
  readonly VITE_API_BASE_URL?: string
  /** 로컬 Vite가 `/api` → 이 오리진으로 프록시. CMS와 동일. */
  readonly VITE_API_SERVER?: string
  readonly VITE_DEV_PROXY_TARGET?: string
  readonly VITE_NGROK_SERVER?: string
  readonly VITE_NGROK_SKIP_BROWSER_WARNING?: string
  /** 리프레시 토큰 POST 경로. 기본 `/api/auth/refresh` */
  readonly VITE_AUTH_REFRESH_PATH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}
