/**
 * 발신 메일 — BE Hub EMAIL 발신 SSOT (2026-09-10)
 * - upsert: `providerSenderEmailAddress` = harvest Select만
 * - harvest 0건 → 400 `EMAIL_SENDER_PROFILES_EMPTY` (sync 유도)
 * - 발신 프로필 목록이 있으면 sender_key(메일)와 소문자 일치 필수
 *   → 미일치 시 400 `EMAIL_SENDER_PROFILE_NOT_HARVESTED`
 * - Hub: 표시명 = harvest `display_name` (FE invent 무시) / `providerStatsKeyId` 미저장
 * - 프로필 미동기화(로컬/mock) 시에는 jakorea.org 도메인만 허용
 */
export const MAIL_ALLOWED_SENDER_DOMAINS = ['jakorea.org'] as const

/** 메일 템플릿 등록 시 기본 발신 메일 (기획) */
export const MAIL_TEMPLATE_DEFAULT_SENDER_EMAIL = 'jakorea@jakorea.org' as const

const EMAIL_SHAPE_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeMailSenderEmailKey(email: string): string {
  return email.trim().toLowerCase()
}

export function isAllowedMailSenderDomain(email: string): boolean {
  const trimmed = normalizeMailSenderEmailKey(email)
  const at = trimmed.lastIndexOf('@')
  if (at < 1) return false
  const domain = trimmed.slice(at + 1)
  return MAIL_ALLOWED_SENDER_DOMAINS.some(
    allowed => domain === allowed || domain.endsWith(`.${allowed}`)
  )
}

export function isHarvestedMailSenderEmail(
  email: string,
  harvestedSenderKeys: readonly string[]
): boolean {
  const key = normalizeMailSenderEmailKey(email)
  if (!key) return false
  return harvestedSenderKeys.some(item => normalizeMailSenderEmailKey(item) === key)
}

export const MAIL_SENDER_EMAIL_REQUIRED_MESSAGE = '발신 메일을 선택/입력해 주세요.'
export const MAIL_SENDER_EMAIL_NOT_REGISTERED_MESSAGE =
  'NHN에 등록된 발신 메일만 사용할 수 있습니다. 발신 프로필을 확인해 주세요.'
export const MAIL_SENDER_EMAIL_SYNC_REQUIRED_MESSAGE =
  'NHN 발신 메일 등록 후 메일 템플릿 화면에서 「동기화」를 실행해 주세요.'
/** Hub harvest 0건 — BE `EMAIL_SENDER_PROFILES_EMPTY` */
export const MAIL_SENDER_PROFILES_EMPTY_MESSAGE =
  'NHN 발신 메일 프로필이 없습니다. 발신 프로필 동기화(sync) 후 다시 시도해 주세요.'
export const MAIL_SENDER_PROFILE_MISMATCH_MESSAGE =
  '메일 발신 프로필이 템플릿 발신 메일과 일치하지 않습니다.'
export const MAIL_SENDER_DISPLAY_NAME_READONLY_HINT =
  '발신자명은 NHN 발신 프로필 표시명(SSOT)입니다. 직접 수정할 수 없습니다.'


/** harvest senderKey 목록에서 대소문자 무시로 매칭되는 원본 키를 반환 */
export function findHarvestedMailSenderKey(
  email: string,
  harvestedSenderKeys: readonly string[]
): string | undefined {
  const key = normalizeMailSenderEmailKey(email)
  if (!key) return undefined
  return harvestedSenderKeys.find(item => normalizeMailSenderEmailKey(item) === key)
}

export type ValidateMailSenderEmailOptions = {
  /** GET sender-profiles(EMAIL) 의 senderKey 목록. 비어 있지 않으면 BE harvest 규칙과 동일하게 검사 */
  harvestedSenderKeys?: readonly string[]
}

export function validateMailSenderEmail(
  email: string,
  options?: ValidateMailSenderEmailOptions
): string | null {
  const trimmed = email.trim()
  if (!trimmed) return MAIL_SENDER_EMAIL_REQUIRED_MESSAGE
  if (!EMAIL_SHAPE_RE.test(trimmed)) return '발신 메일 형식이 올바르지 않습니다.'

  const harvested = options?.harvestedSenderKeys
  if (harvested && harvested.length > 0) {
    if (!isHarvestedMailSenderEmail(trimmed, harvested)) {
      return MAIL_SENDER_EMAIL_NOT_REGISTERED_MESSAGE
    }
    return null
  }

  if (!isAllowedMailSenderDomain(trimmed)) {
    return MAIL_SENDER_EMAIL_NOT_REGISTERED_MESSAGE
  }
  return null
}
