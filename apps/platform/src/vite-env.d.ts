/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

interface ImportMetaEnv {
  readonly VITE_ADDRESS_API_KEY?: string
  readonly VITE_JUSO_CONFM_KEY?: string
  readonly VITE_JUSO_ADDRESS_API_URL?: string
  readonly VITE_NEIS_API_KEY?: string
  /** 커리어넷 OpenAPI 인증키 (대학교 검색) */
  readonly VITE_CAREER_NET_API_KEY?: string
  /** @deprecated 오타 호환 — `VITE_CAREER_NET_API_KEY` 사용 권장 */
  readonly VITE_CAREEAR_NET_API_KEY?: string
  /** 정적 배포에서 JABACK을 직접 호출할 오리진. 로컬 프록시 쓸 때는 비움. */
  readonly VITE_API_BASE_URL?: string
  /** 정적 배포에서 JAHOME을 직접 호출할 오리진. */
  readonly VITE_HOMEPAGE_API_BASE_URL?: string
  /** 로컬 Vite `/api/portal`, `/api/auth` → CMS(8080) 로그인·회원·NICE */
  readonly VITE_API_SERVER?: string
  /** 로컬 Vite `/api` → JAHOMEADMINBACK(8081). 미설정 시 http://localhost:8081 */
  readonly VITE_HOMEPAGE_API_SERVER?: string
  readonly VITE_DEV_PROXY_TARGET?: string
  readonly VITE_NGROK_SERVER?: string
  readonly VITE_NGROK_SKIP_BROWSER_WARNING?: string
  /** 리프레시 토큰 POST 경로. 기본 `/api/portal/auth/refresh` */
  readonly VITE_AUTH_REFRESH_PATH?: string
  /** OAuth frontendReturnUrl origin (로그인 완료·가입 연결 복귀) */
  readonly VITE_OAUTH_REDIRECT_ORIGIN?: string
  /** IdP redirect_uri용 백엔드 public origin */
  readonly VITE_OAUTH_BACKEND_ORIGIN?: string
  /** mock 전용 — remote Portal SSO는 BE가 client 보유 */
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_KAKAO_CLIENT_ID?: string
  readonly VITE_PLATFORM_NAVER_CLIENT_ID?: string
  /** Vite 빌드 시각 (Asia/Seoul) */
  readonly VITE_APP_BUILD_AT?: string
  /** Vercel/GitHub 커밋 SHA 앞 7자 */
  readonly VITE_APP_GIT_SHA?: string
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

declare module '*.svg?url' {
  const src: string
  export default src
}

declare module '*.svg?raw' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.jpeg' {
  const src: string
  export default src
}

declare module '*.pdf' {
  const src: string
  export default src
}
