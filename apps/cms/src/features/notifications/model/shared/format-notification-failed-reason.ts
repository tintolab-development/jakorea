/**
 * BE failedReason / API message 표시용.
 * `NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:키`
 * `NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:키1,키2`
 * → `템플릿 필수 변수가 없습니다: 키` / `…: 키1, 키2`
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

export function formatNotificationFailedReason(raw?: string | null): string {
  const text = (raw ?? '').trim()
  if (!text) return ''
  const missingPrefix = 'NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING'
  if (text === missingPrefix || text.startsWith(`${missingPrefix}:`)) {
    return formatNotificationMissingVariablesMessage(parseNotificationMissingVariableKeys(text))
  }
  if (text.startsWith('필수 변수') || text.startsWith('템플릿 필수 변수')) return text
  return text
}
