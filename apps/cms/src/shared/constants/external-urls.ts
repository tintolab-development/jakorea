/** 1365 자원봉사 포털 메인 — CMS 공통 「1365 바로가기」 목적지 */
export const PORTAL_1365_MAIN_URL = 'https://www.1365.go.kr/vols/main.do' as const

export function openPortal1365Main(): void {
  window.open(PORTAL_1365_MAIN_URL, '_blank', 'noopener,noreferrer')
}
