/**
 * global-value — Remote API only (localStorage mock 없음)
 */
export function shouldUseGlobalValueRemoteApi(): boolean {
  return true
}

/**
 * 서버가 6개 항목(VALUE_6 추가)을 지원하는지.
 * false 동안 화면은 시안 6행 미리보기(`GLOBAL_VALUE_PREVIEW_ROWS`)를 그리고 서버를 조회·저장하지 않는다.
 * BE 요청: docs/api/global-value-six-items-backend-request-2026-11-13.md — 배포 후 true로 바꾸고 Orval 재생성.
 */
export const GLOBAL_VALUE_SIX_ITEMS_SERVER_READY = false
