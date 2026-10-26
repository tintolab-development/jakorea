/**
 * BE failedReason / API message 표시용.
 * - 발송 POST 400 (`getNotificationsApiErrorMessage`): `formatNotificationMissingVariablesMessage`
 *   → `템플릿 필수 변수가 없습니다: 키1, 키2`
 * - 발송 결과 failedReason (`formatNotificationFailedReason`):
 *   `NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:키1,키2`
 *   → `자동입력 변수값이 없어 발송되지 않았습니다: 키1, 키2`
 * `NOTIFICATION_SERVER_RESERVED_VARIABLE:키` → 예약 변수 안내 (키 유지)
 */
export function formatNotificationMissingVariablesMessage(missingKeys: string[]): string {
  const labels = missingKeys.map(key => key.trim()).filter(Boolean)
  if (labels.length === 0) return '템플릿 필수 변수가 없습니다.'
  return `템플릿 필수 변수가 없습니다: ${labels.join(', ')}`
}

export function parseNotificationMissingVariableKeys(raw: string): string[] {
  const text = raw.trim()
  if (!text) return []
  const missingPrefix = 'NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING'
  let payload = text
  if (text === missingPrefix) return []
  if (text.startsWith(`${missingPrefix}:`)) {
    payload = text.slice(missingPrefix.length).replace(/^:\s*/, '').trim()
  }
  if (!payload) return []
  return payload
    .split(',')
    .map(key => key.trim())
    .filter(Boolean)
}

export function formatNotificationServerReservedVariableMessage(keys: string[]): string {
  const labels = keys.map(key => key.trim()).filter(Boolean)
  if (labels.length === 0) {
    return '서버가 채우는 예약 변수는 발송 요청에 넣을 수 없습니다.'
  }
  return `서버가 채우는 예약 변수는 발송 요청에 넣을 수 없습니다: ${labels.join(', ')}`
}

export function parseNotificationServerReservedVariableKeys(raw: string): string[] {
  const text = raw.trim()
  if (!text) return []
  const prefix = 'NOTIFICATION_SERVER_RESERVED_VARIABLE'
  if (text === prefix) return []
  if (text.startsWith(`${prefix}:`)) {
    return text
      .slice(prefix.length)
      .replace(/^:\s*/, '')
      .trim()
      .split(',')
      .map(key => key.trim())
      .filter(Boolean)
  }
  return []
}

/** 구 BE 수신자 변수 누락 failureCode 접두어 — 상세(`;type=…` 등)는 노출하지 않는다 */
export const NOTIFICATION_VARIABLE_RESOLUTION_FAILED_PREFIX =
  'NOTIFICATION_TEMPLATE_VARIABLE_RESOLUTION_FAILED'

const DELIVERY_VARIABLE_MISSING_MESSAGE = '자동입력 변수값이 없어 발송되지 않았습니다'

/** 발송 결과(failedReason) — 수신자별 자동입력 변수 누락 안내 */
export function formatNotificationDeliveryMissingVariablesMessage(missingKeys: string[]): string {
  const labels = missingKeys.map(key => key.trim()).filter(Boolean)
  if (labels.length === 0) return `${DELIVERY_VARIABLE_MISSING_MESSAGE}.`
  return `${DELIVERY_VARIABLE_MISSING_MESSAGE}: ${labels.join(', ')}`
}

export function formatNotificationFailedReason(raw?: string | null): string {
  const text = (raw ?? '').trim()
  if (!text) return ''
  if (text.startsWith(NOTIFICATION_VARIABLE_RESOLUTION_FAILED_PREFIX)) {
    return formatNotificationDeliveryMissingVariablesMessage([])
  }
  const missingPrefix = 'NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING'
  if (text === missingPrefix || text.startsWith(`${missingPrefix}:`)) {
    return formatNotificationDeliveryMissingVariablesMessage(
      parseNotificationMissingVariableKeys(text)
    )
  }
  const reservedPrefix = 'NOTIFICATION_SERVER_RESERVED_VARIABLE'
  if (text === reservedPrefix || text.startsWith(`${reservedPrefix}:`)) {
    return formatNotificationServerReservedVariableMessage(
      parseNotificationServerReservedVariableKeys(text)
    )
  }
  if (text.startsWith('필수 변수') || text.startsWith('템플릿 필수 변수')) return text
  return text
}
