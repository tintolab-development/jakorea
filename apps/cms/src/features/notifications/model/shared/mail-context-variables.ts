/**
 * 메일 수동 발송 문맥 변수 — 회원 계정 SSOT가 아님 (BE 2026-09-10).
 * enrich로 채워지지 않음. catalog SYSTEM 키라 create.variables 덮어쓰기는
 * NOTIFICATION_SERVER_RESERVED_VARIABLE 로 거절되므로 **본문/제목에 로컬 치환**한다.
 */
export const NOTIFICATION_MAIL_CONTEXT_PLACEHOLDER_KEYS = [
  '동의 항목',
  '만료일시',
] as const

export type NotificationMailContextPlaceholderKey =
  (typeof NOTIFICATION_MAIL_CONTEXT_PLACEHOLDER_KEYS)[number]

export const NOTIFICATION_MAIL_CONTEXT_VARIABLES_HINT =
  '「동의 항목」「만료일시」등은 회원 프로필 자동값이 아닙니다. 아래에 넣은 값은 발송 본문·제목에 반영됩니다. 불필요하면 해당 토큰을 템플릿에서 제거하세요.'

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
      if (raw.includes(`#{${key}}`) || raw.includes(`data-mail-variable="${key}"`)) {
        found.add(key)
      }
    }
  }
  return NOTIFICATION_MAIL_CONTEXT_PLACEHOLDER_KEYS.filter(key => found.has(key))
}

/** 입력값을 모은다. 빈 문자열은 제외. */
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * `#{키}` 및 메일 변수 칩(span[data-mail-variable])을 값으로 치환.
 * create.variables 에 catalog 키를 넣지 않고 발송 스냅샷에 값을 싣기 위함.
 */
export function substituteNotificationPlaceholderValues(
  text: string,
  values: Record<string, string> | null | undefined
): string {
  if (!text || !values) return text
  let next = text
  for (const [key, raw] of Object.entries(values)) {
    const trimmedKey = key.trim()
    const trimmedValue = typeof raw === 'string' ? raw.trim() : ''
    if (!trimmedKey || !trimmedValue) continue
    const token = `#{${trimmedKey}}`
    next = next.split(token).join(trimmedValue)
    const chipRe = new RegExp(
      `<span\\b[^>]*data-mail-variable="${escapeRegExp(trimmedKey)}"[^>]*>[\\s\\S]*?<\\/span>`,
      'gi'
    )
    next = next.replace(chipRe, trimmedValue)
  }
  return next
}

/** 문맥 변수 값을 제목·본문에 반영 (variables 맵으로 보내지 않음) */
export function applyMailContextVariableSubstitutions(input: {
  subject: string
  bodyHtml: string
  values?: Record<string, string> | null
}): { subject: string; bodyHtml: string } {
  return {
    subject: substituteNotificationPlaceholderValues(input.subject, input.values),
    bodyHtml: substituteNotificationPlaceholderValues(input.bodyHtml, input.values),
  }
}
