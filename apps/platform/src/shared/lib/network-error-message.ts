import { PLATFORM_ALERT_COPY } from './platform-alert-copy'

/**
 * 응답 본문이 없는 오류(서버 미응답·연결 끊김·502 등) 안내 — Platform 시안 「네트워크 오류 안내」
 * (사용자 플랫폼 Figma 14491-2867 '변경'). CMS 문구와는 별개다.
 */
export const NETWORK_ERROR_ALERT_TITLE = PLATFORM_ALERT_COPY.networkError.title
export const NETWORK_ERROR_ALERT_CONTENT = PLATFORM_ALERT_COPY.networkError.description
/** 팝업이 아닌 인라인 문구 — 본문만으로는 뜻이 없어 제목과 본문을 두 줄로 쓴다 */
export const NETWORK_ERROR_INLINE_MESSAGE = `${NETWORK_ERROR_ALERT_TITLE}\n${NETWORK_ERROR_ALERT_CONTENT}`
