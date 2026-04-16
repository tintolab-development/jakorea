/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NAVER_CLIENT_ID?: string
  readonly VITE_NAVER_CLIENT_SECRET?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_GOOGLE_CLIENT_SECRET?: string
  readonly VITE_KAKAO_CLIENT_ID?: string
  readonly VITE_KAKAO_CLIENT_SECRET?: string
  readonly VITE_OAUTH_EXCHANGE_MODE?: string
  readonly VITE_API_BASE_URL?: string
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
