/**
 * 알림 채널 공통 — 템플릿명 입력 UI
 * placeholder는 고정, 허용 문자는 채널별 validate·sanitize로만 강제
 */
export const TEMPLATE_NAME_INPUT_PLACEHOLDER = '템플릿명을 입력하세요' as const

/** 한글·영문·숫자·_·- (공백·기타 특수문자 제외) */
export const NOTIFICATION_TEMPLATE_NAME_ALLOWED_CHAR = /[\uAC00-\uD7A3A-Za-z0-9_-]/g

/** 입력 중 허용 문자만 남김 (붙여넣기·타이핑 모두) */
export function sanitizeNotificationTemplateNameInput(value: string): string {
  return value.match(NOTIFICATION_TEMPLATE_NAME_ALLOWED_CHAR)?.join('') ?? ''
}
