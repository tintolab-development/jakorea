/**
 * 발신 메일 — NHN 등록 도메인만 허용 (기획 2-3 / 3)
 * API 연동 전 FE 허용 목록. 백엔드 도메인 목록이 생기면 교체.
 */
export const MAIL_ALLOWED_SENDER_DOMAINS = ['jakorea.org'] as const

const EMAIL_SHAPE_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isAllowedMailSenderDomain(email: string): boolean {
  const trimmed = email.trim().toLowerCase()
  const at = trimmed.lastIndexOf('@')
  if (at < 1) return false
  const domain = trimmed.slice(at + 1)
  return MAIL_ALLOWED_SENDER_DOMAINS.some(
    allowed => domain === allowed || domain.endsWith(`.${allowed}`)
  )
}

export const MAIL_SENDER_EMAIL_REQUIRED_MESSAGE = '발신 메일을 선택/입력해 주세요.'
export const MAIL_SENDER_EMAIL_NOT_REGISTERED_MESSAGE =
  'NHN에 등록된 발신 메일만 사용할 수 있습니다. 발신 프로필을 확인해 주세요.'

export function validateMailSenderEmail(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) return MAIL_SENDER_EMAIL_REQUIRED_MESSAGE
  if (!EMAIL_SHAPE_RE.test(trimmed)) return '발신 메일 형식이 올바르지 않습니다.'
  if (!isAllowedMailSenderDomain(trimmed)) {
    return MAIL_SENDER_EMAIL_NOT_REGISTERED_MESSAGE
  }
  return null
}
