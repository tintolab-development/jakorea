/**
 * 알림 채널 공통 — 템플릿명 입력 UI
 * placeholder는 고정, 허용 문자는 채널별 validate·sanitize로만 강제
 *
 * sanitize: 입력 중 한글 자모(ㄱ-ㅎ/ㅏ-ㅣ·Jamo)도 허용 — IME 조합이 깨지지 않게
 * validate: 제출 시에는 완성 한글만 허용(채널별 template-name)
 */
export const TEMPLATE_NAME_INPUT_PLACEHOLDER = '템플릿명을 입력하세요' as const

/** 완성 한글·조합 중 자모·영문·숫자·_·- (공백·기타 특수문자 제외) */
const NOTIFICATION_TEMPLATE_NAME_DISALLOWED =
  /[^0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ\u1100-\u11FF_-]/g

/** @deprecated 매칭용 — DISALLOWED replace 방식 사용 권장 */
export const NOTIFICATION_TEMPLATE_NAME_ALLOWED_CHAR =
  /[0-9A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ\u1100-\u11FF_-]/g

/** 입력 중 허용 문자만 남김 (붙여넣기·타이핑 모두). 자모는 조합용으로 유지 */
export function sanitizeNotificationTemplateNameInput(value: string): string {
  return value.replace(NOTIFICATION_TEMPLATE_NAME_DISALLOWED, '')
}
