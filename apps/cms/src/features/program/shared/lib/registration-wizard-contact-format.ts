import { isValidKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'

export const FIELD_FORMAT_MISMATCH_ALERT_TITLE = '서식 불일치 안내'

export const FIELD_FORMAT_PHONE_MESSAGE =
  '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'

export const FIELD_FORMAT_EMAIL_MESSAGE = '올바른 이메일 형식이 아닙니다'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const PHONE_KEY = /(^|\.)(inquiryTel|contactPhone|phone|teacherTel|teacherMobile)$/i
const EMAIL_KEY = /(^|\.)(inquiryEmail|contactEmail|email|teacherEmail)$/i

export type RegistrationContactFormatIssue = {
  key: string
  message: string
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function highlightKey(key: string): string {
  let mapped = key
  const recruitAt = mapped.search(/(?:^|\.)recruit\./i)
  if (recruitAt >= 0) {
    mapped = mapped.slice(mapped[recruitAt] === '.' ? recruitAt + 1 : recruitAt)
  }
  if (/(^|\.)phone$/i.test(mapped)) return mapped.replace(/\.phone$/i, '.inquiryTel')
  if (/(^|\.)email$/i.test(mapped)) return mapped.replace(/\.email$/i, '.inquiryEmail')
  return mapped
}

function pushIssue(
  issues: RegistrationContactFormatIssue[],
  seen: Set<string>,
  key: string,
  message: string
): void {
  const mapped = highlightKey(key)
  if (seen.has(mapped)) return
  seen.add(mapped)
  issues.push({ key: mapped, message })
}

function walk(
  issues: RegistrationContactFormatIssue[],
  seen: Set<string>,
  key: string,
  value: unknown,
  depth: number,
  includeKey: (key: string) => boolean
): void {
  if (depth > 6 || value == null) return

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      walk(issues, seen, `${key}[${index}]`, item, depth + 1, includeKey)
    })
    return
  }

  if (typeof value === 'object') {
    for (const [childKey, child] of Object.entries(value as Record<string, unknown>)) {
      const nextKey = key ? `${key}.${childKey}` : childKey
      walk(issues, seen, nextKey, child, depth + 1, includeKey)
    }
    return
  }

  if (key !== '' && !includeKey(key)) return
  const text = asText(value)
  if (!text) return
  if (PHONE_KEY.test(key) && !isValidKoreanPhoneNumber(text)) {
    pushIssue(issues, seen, key, FIELD_FORMAT_PHONE_MESSAGE)
    return
  }
  if (EMAIL_KEY.test(key) && !EMAIL_PATTERN.test(text)) {
    pushIssue(issues, seen, key, FIELD_FORMAT_EMAIL_MESSAGE)
  }
}

export function listContactFormatIssuesFromUnknown(
  value: unknown,
  includeKey: (key: string) => boolean = () => true
): RegistrationContactFormatIssue[] {
  const issues: RegistrationContactFormatIssue[] = []
  const seen = new Set<string>()
  walk(issues, seen, '', value, 0, includeKey)
  return issues
}

export function isRecruitmentContactFormatKey(key: string): boolean {
  if (!key) return true
  return /(^|\.)(recruit|recruitment|inquiryTel|inquiryEmail)(\.|$)/i.test(key)
}

export function isProgramContactFormatKey(key: string): boolean {
  if (!key) return true
  return !isRecruitmentContactFormatKey(key)
}
