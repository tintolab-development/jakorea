import { NETWORK_ERROR_ALERT_CONTENT } from '@/shared/lib/extract-api-error-message'

const HANGUL = /[가-힣]/
/** `@jakorea/location` 클라이언트가 던지는 개발용 문구 */
const DEV_MESSAGE = /^(HTTP \d+|API 오류)$/

/**
 * 학교·대학 공공 API(NEIS·커리어넷) 검색 오류를 화면 문구로 바꾼다.
 * 브라우저·HTTP 개발 문구(`Failed to fetch`, `HTTP 500` 등, 한글이 없는 문구)는
 * 시안 「네트워크 오류 안내」(16898-166096) 본문으로 바꾸고, API가 준 한글 안내(키 미설정 등)는 그대로 둔다.
 */
export function toPublicSearchErrorMessage(error: Error): string {
  const message = error.message.trim()
  if (!message || !HANGUL.test(message) || DEV_MESSAGE.test(message)) {
    return NETWORK_ERROR_ALERT_CONTENT
  }
  return message
}
