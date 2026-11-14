/**
 * 응답 본문이 없는 오류(서버 미응답·연결 끊김·502 등) 안내 — 시안 「네트워크 오류 안내」
 * (CMS Figma U6QntWGwBOxMszahPxjmGX 16898-166096, CMS `extract-api-error-message.ts`와 같은 문구).
 * 팝업이면 제목+본문, 인라인 문구면 본문만 쓴다.
 */
export const NETWORK_ERROR_ALERT_TITLE = '네트워크 오류 안내'
export const NETWORK_ERROR_ALERT_CONTENT =
  '일시적인 네트워크 오류가 발생하였습니다.\n잠시 후 다시 시도해 주세요.'
