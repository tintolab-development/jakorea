/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NAVER_CLIENT_ID?: string
  readonly VITE_NAVER_CLIENT_SECRET?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_GOOGLE_CLIENT_SECRET?: string
  readonly VITE_KAKAO_CLIENT_ID?: string
  readonly VITE_KAKAO_CLIENT_SECRET?: string
  readonly VITE_OAUTH_EXCHANGE_MODE?: string
  /**
   * 쉼표 구분 실 API 모듈 키 (`shared/config/real-api-modules`). 미설정·빈 값이면 원격 URL이 있어도 전부 mock.
   * 관리자 이메일 로그인을 실 API로 쓰려면 `adminAuth` 포함. 예: `adminAuth` | `adminAuth,textbooks`
   */
  readonly VITE_REAL_API_MODULES?: string
  readonly VITE_API_BASE_URL?: string
  /**
   * 로컬 dev: `vite.config`에서 `/api` 프록시 타깃(배포 API·ngrok 오리진). `VITE_API_BASE_URL` 비울 때 클라이언트도 상대 `/api` 사용.
   */
  readonly VITE_API_SERVER?: string
  /** 예전 주석용 이름 — `VITE_API_SERVER`와 동일 역할(하위 호환). */
  readonly VITE_NGROK_SERVER?: string
  /**
   * `VITE_API_SERVER` 대체 이름 — 동일 동작.
   */
  readonly VITE_DEV_PROXY_TARGET?: string
  /** 관리자 인증 API 경로 prefix (기본 `/api/admin/auth`) */
  readonly VITE_ADMIN_AUTH_API_PREFIX?: string
  /** 리프레시 토큰 API 경로 (기본: `/api/auth/refresh`). `VITE_API_BASE_URL` 오리진 뒤에 붙습니다. */
  readonly VITE_AUTH_REFRESH_PATH?: string
  /** ngrok 등에서 브라우저 경고 우회용 헤더 값 */
  readonly VITE_NGROK_SKIP_BROWSER_WARNING?: string
  /** 행안부·주소기반산업지원서비스 도로명주소 검색 API 승인키(confmKey) */
  readonly VITE_ADDRESS_API_KEY?: string
  /** `VITE_ADDRESS_API_KEY` 대체 이름(행안부 샘플·문서에서 쓰는 이름) */
  readonly VITE_JUSO_CONFM_KEY?: string
  /**
   * 주소 검색 API 전체 URL (쿼리스트링 앞까지).
   * 미설정 시 `https://www.juso.go.kr/addrlink/addrLinkApi.do`
   * 사업용 키는 `https://business.juso.go.kr/addrlink/addrLinkApi.do` 등으로 지정
   */
  readonly VITE_JUSO_ADDRESS_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
