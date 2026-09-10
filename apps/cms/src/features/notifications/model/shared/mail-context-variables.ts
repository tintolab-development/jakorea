/**
 * 메일 수동 발송 문맥 변수 — 회원 계정 SSOT가 아님 (BE 2026-09-10).
 * enrich로 채워지지 않으므로 create body `variables` 또는 템플릿에서 토큰 제거.
 */
export const NOTIFICATION_MAIL_CONTEXT_PLACEHOLDER_KEYS = [
  '동의 항목',
  '만료일시',
] as const

export type NotificationMailContextPlaceholderKey =
  (typeof NOTIFICATION_MAIL_CONTEXT_PLACEHOLDER_KEYS)[number]

export const NOTIFICATION_MAIL_CONTEXT_VARIABLES_HINT =
  '「동의 항목」「만료일시」등은 회원 프로필 자동값이 아닙니다. 수동 발송 시 아래에 값을 넣거나, 해당 토큰을 템플릿에서 제거하세요.'

export function isNotificationMailContextPlaceholderKey(
  key: string
): key is NotificationMailContextPlaceholderKey {
  return (NOTIFICATION_MAIL_CONTEXT_PLACEHOLDER_KEYS as readonly string[]).includes(key.trim())
}

/** 본문/제목에 등장한 문맥 키만 (삽입만 하고 값 공급이 필요한 키) */
export function listNotificationMailContextKeysInTexts(
  ...texts: Array<string | null | undefined>
): NotificationMailContextPlaceholderKey[] {
  const found = new Set<NotificationMailContextPlaceholderKey>()
  for (const raw of texts) {
    if (!raw) continue
    for (const key of NOTIFICATION_MAIL_CONTEXT_PLACEHOLDER_KEYS) {
      if (raw.includes(`#{${key}}`)) found.add(key)
    }
  }
  return NOTIFICATION_MAIL_CONTEXT_PLACEHOLDER_KEYS.filter(key => found.has(key))
}

/** create.variables 용 — 빈 문자열은 넣지 않음 (BE는 빈 값으로 enrich를 덮지 않음) */
export function pickNotificationMailContextVariables(
  values: Partial<Record<NotificationMailContextPlaceholderKey, string>> | null | undefined
): Record<string, string> | undefined {
  if (!values) return undefined
  const next: Record<string, string> = {}
  for (const key of NOTIFICATION_MAIL_CONTEXT_PLACEHOLDER_KEYS) {
    const trimmed = values[key]?.trim()
    if (trimmed) next[key] = trimmed
  }
  return Object.keys(next).length > 0 ? next : undefined
}
